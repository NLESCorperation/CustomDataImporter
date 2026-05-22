const { app, BrowserWindow, ipcMain, dialog, net, session } = require('electron');
const path = require('path');
const fs = require('fs');
const keytar = require('keytar');

// Service name for keytar (OS keychain)
const SERVICE_NAME = 'SotiCustomDataImporter';
const ALLOW_INSECURE_CERTS =
    process.env.SOTI_ALLOW_INSECURE_CERTS === '1' ||
    process.argv.includes('--allow-insecure-soti-certs');
const E2E_MOCK_API = process.env.E2E_MOCK_API === '1';

let mainWindow;
const mockApiState = {
    scenario: 'success',
    token: 'mock-token',
    groups: [
        { ReferenceId: 'G1', Name: 'UX Test Group', Path: '\\UX Test Group' }
    ],
    customDataDefinitions: [
        { Name: 'AssetTag' },
        { Name: 'DeviceConfig' }
    ],
    customAttributes: [
        { Name: 'AssetTag', Value: '12345', DataType: 'String', IsInherited: false }
    ]
};
const mockCredentials = new Map();

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        minWidth: 800,
        minHeight: 600,
        backgroundColor: '#1a1a2e',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        },
        titleBarStyle: 'hiddenInset',
        trafficLightPosition: { x: 15, y: 15 }
    });

    mainWindow.loadFile('src/index.html');
}

// ==================== SOTI API Helpers (Main Process) ====================
// Using net.fetch from Electron to bypass CORS restrictions

const DEFAULT_TIMEOUT_MS = 30000;
const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await net.fetch(url, { ...options, signal: controller.signal });
        return response;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error(`Request timed out after ${timeoutMs / 1000}s: ${url}`);
        }
        throw error;
    } finally {
        clearTimeout(timer);
    }
}

function validateServerUrl(url) {
    if (!url || typeof url !== 'string') {
        throw new Error('Server URL is required');
    }
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:') {
            const isLocalHttp =
                parsed.protocol === 'http:' &&
                ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
            if (!isLocalHttp) {
                throw new Error('Server URL must use HTTPS');
            }
        }
        if (parsed.username || parsed.password) {
            throw new Error('Server URL must not contain embedded credentials');
        }
        if (parsed.hash) {
            throw new Error('Server URL must not contain a fragment');
        }
        if (parsed.search) {
            throw new Error('Server URL must not contain a query string');
        }
        return parsed.origin + parsed.pathname.replace(/\/+$/, '');
    } catch (e) {
        if (e.message.startsWith('Server URL')) throw e;
        throw new Error(`Invalid server URL: ${e.message}`);
    }
}

function validateApiEndpoint(endpoint) {
    if (!endpoint || typeof endpoint !== 'string') {
        throw new Error('API endpoint is required');
    }
    if (!endpoint.startsWith('/') || endpoint.startsWith('//')) {
        throw new Error('API endpoint must be a relative path');
    }
    const parsed = new URL(endpoint, 'https://soti.local');
    if (parsed.origin !== 'https://soti.local') {
        throw new Error('API endpoint must not contain a host');
    }
    if (!parsed.pathname.startsWith('/MobiControl/api/')) {
        throw new Error('API endpoint must target /MobiControl/api/');
    }
    return `${parsed.pathname}${parsed.search}`;
}

function validateHttpMethod(method = 'GET') {
    const normalized = String(method || 'GET').toUpperCase();
    if (!ALLOWED_METHODS.has(normalized)) {
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
    return normalized;
}

async function parseResponse(response, fallbackMessage = 'Request failed') {
    const text = await response.text();

    if (!response.ok) {
        throw new Error(`${fallbackMessage}: ${response.status}${text ? ` - ${text}` : ''}`);
    }

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

function parseCsvRows(content) {
    const rows = [];
    let row = [];
    let value = '';
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const next = content[i + 1];

        if (char === '"') {
            if (inQuotes && next === '"') {
                value += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === ',' && !inQuotes) {
            row.push(value.trim());
            value = '';
            continue;
        }

        if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && next === '\n') i++;
            row.push(value.trim());
            if (row.some(cell => cell !== '')) rows.push(row);
            row = [];
            value = '';
            continue;
        }

        value += char;
    }

    row.push(value.trim());
    if (row.some(cell => cell !== '')) rows.push(row);
    return rows;
}

function normalizeImportedItem(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const name = raw.Name || raw.name || raw.key || raw.Key;
    const type = (raw.type || raw.Type || 'ini').toLowerCase();

    if (!name) return null;
    if (type === 'ini') {
        const file = raw.FileName || raw.fileName || raw.file || raw.File;
        const section = raw.Section || raw.section;
        const valName = raw.KeyName || raw.keyName || raw.valName || raw.ValueName;
        if (!file || !section || !valName) return null;
        return {
            key: name,
            value: {
                type: 'ini',
                file,
                section,
                valName,
                description: raw.Description || raw.description || '',
                dataType: 'STRING'
            }
        };
    }

    if (type === 'static' || raw.value !== undefined || raw.Value !== undefined) {
        return {
            key: name,
            value: {
                type: 'static',
                value: raw.value !== undefined ? raw.value : raw.Value,
                description: raw.Description || raw.description || ''
            }
        };
    }

    return null;
}

function getMockGroupObject(groupPath = '\\UX Test Group') {
    return {
        ReferenceId: 'G1',
        Name: groupPath.split('\\').pop() || 'UX Test Group',
        Path: groupPath,
        AreCustomAttributesInherited: false,
        CustomAttributes: mockApiState.customAttributes
    };
}

function mockGenericSotiRequest(endpoint, method, body) {
    const lowerEndpoint = endpoint.toLowerCase();
    const normalizedMethod = validateHttpMethod(method);

    if (mockApiState.scenario === 'groupError' && lowerEndpoint.includes('/devicegroups')) {
        return { success: false, error: 'Request failed: 500 - Internal Server Error' };
    }

    if (normalizedMethod === 'GET' && lowerEndpoint === '/mobicontrol/api/customdata') {
        return { success: true, data: mockApiState.customDataDefinitions };
    }

    if (normalizedMethod === 'POST' && lowerEndpoint === '/mobicontrol/api/customdata') {
        mockApiState.customDataDefinitions.push(body);
        return { success: true, data: body };
    }

    if (normalizedMethod === 'GET' && lowerEndpoint === '/mobicontrol/api/customattributes') {
        return { success: true, data: mockApiState.customAttributes };
    }

    if (normalizedMethod === 'POST' && lowerEndpoint === '/mobicontrol/api/customattributes') {
        mockApiState.customAttributes.push({ Name: body.Name, Value: '', DataType: body.CustomAttributeDataType || 'String' });
        return { success: true, data: body };
    }

    if (normalizedMethod === 'GET' && lowerEndpoint.includes('/devicegroups/')) {
        const customAttributesPath = lowerEndpoint.endsWith('/customattributes');
        const customDataPath = lowerEndpoint.endsWith('/customdata');
        if (customAttributesPath) return { success: true, data: mockApiState.customAttributes };
        if (customDataPath) return { success: true, data: mockApiState.customDataDefinitions };
        return { success: true, data: getMockGroupObject() };
    }

    if ((normalizedMethod === 'PUT' || normalizedMethod === 'PATCH') && lowerEndpoint.includes('/devicegroups/')) {
        if (lowerEndpoint.includes('/customattributes/')) {
            const attrName = decodeURIComponent(endpoint.split('/customAttributes/')[1] || endpoint.split('/customattributes/')[1] || '');
            const existing = mockApiState.customAttributes.find(a => (a.Name || '').toLowerCase() === attrName.toLowerCase());
            if (existing) existing.Value = body;
            else mockApiState.customAttributes.push({ Name: attrName, Value: body, DataType: 'String' });
        }
        return { success: true, data: {} };
    }

    return { success: true, data: {} };
}

app.whenReady().then(() => {
    if (ALLOW_INSECURE_CERTS) {
        session.defaultSession.setCertificateVerifyProc((request, callback) => {
            console.warn(`[Certificate] Allowing certificate for ${request.hostname}`);
            callback(0);
        });
    }
    
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    console.log(`[Certificate] Certificate error for ${url}: ${error}`);
    if (ALLOW_INSECURE_CERTS) {
        event.preventDefault();
        callback(true);
        return;
    }
    callback(false);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// ==================== IPC Handlers ====================

// Credential Management (using OS keychain via keytar)
ipcMain.handle('credentials:save', async (event, profileName, credentials) => {
    try {
        if (E2E_MOCK_API) {
            mockCredentials.set(profileName, credentials);
            return { success: true };
        }
        await keytar.setPassword(SERVICE_NAME, profileName, JSON.stringify(credentials));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('credentials:get', async (event, profileName) => {
    try {
        if (E2E_MOCK_API) {
            return mockCredentials.get(profileName) || null;
        }
        const data = await keytar.getPassword(SERVICE_NAME, profileName);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        return null;
    }
});

ipcMain.handle('credentials:list', async () => {
    try {
        if (E2E_MOCK_API) {
            return Array.from(mockCredentials.keys());
        }
        const credentials = await keytar.findCredentials(SERVICE_NAME);
        return credentials.map(c => c.account);
    } catch (error) {
        return [];
    }
});

ipcMain.handle('credentials:delete', async (event, profileName) => {
    try {
        if (E2E_MOCK_API) {
            mockCredentials.delete(profileName);
            return { success: true };
        }
        await keytar.deletePassword(SERVICE_NAME, profileName);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

if (E2E_MOCK_API) {
    ipcMain.handle('test:setMockScenario', async (event, scenario, overrides = {}) => {
        mockApiState.scenario = scenario || 'success';
        Object.assign(mockApiState, overrides || {});
        return { success: true };
    });
}

// File Dialog
ipcMain.handle('dialog:openFile', async (event, filters) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: filters || [
            { name: 'Import Files', extensions: ['csv', 'json'] }
        ]
    });

    if (result.canceled || result.filePaths.length === 0) {
        return null;
    }

    return result.filePaths[0];
});

// File Parsing
ipcMain.handle('file:parse', async (event, filePath) => {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const ext = path.extname(filePath).toLowerCase();
        let data = {};

        if (ext === '.csv') {
            const rows = parseCsvRows(content);
            const header = rows[0]?.map(cell => cell.toLowerCase());
            const hasHeader = header?.some(cell => ['name', 'filename', 'section', 'keyname', 'description'].includes(cell));
            const bodyRows = hasHeader ? rows.slice(1) : rows;

            for (const row of bodyRows) {
                const raw = hasHeader
                    ? Object.fromEntries(header.map((key, index) => [key, row[index] || '']))
                    : {
                        name: row[0],
                        filename: row[1],
                        section: row[2],
                        keyname: row[3],
                        description: row[4] || ''
                    };
                const item = normalizeImportedItem({
                    Name: raw.name,
                    FileName: raw.filename,
                    Section: raw.section,
                    KeyName: raw.keyname,
                    Description: raw.description
                });
                if (item) data[item.key] = item.value;
            }
        } else if (ext === '.json') {
            const parsed = JSON.parse(content);
            const items = Array.isArray(parsed) ? parsed : Object.entries(parsed).map(([key, value]) => ({ key, ...value }));
            for (const raw of items) {
                const item = normalizeImportedItem(raw);
                if (item) data[item.key] = item.value;
            }
        } else {
            throw new Error(`Unsupported file format: ${ext}. Use .csv or .json.`);
        }

        return { success: true, data, fileName: path.basename(filePath) };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// ==================== SOTI API IPC Handlers ====================

// Get authentication token
ipcMain.handle('soti:getToken', async (event, serverUrl, clientId, clientSecret, username, password) => {
    try {
        if (E2E_MOCK_API) {
            if (mockApiState.scenario === 'invalidCredentials') {
                return { success: false, error: 'Authentication failed: 401 - Unauthorized' };
            }
            return { success: true, token: mockApiState.token };
        }

        const validatedUrl = validateServerUrl(serverUrl);
        const tokenUrl = `${validatedUrl}/MobiControl/api/token`;
        const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        console.log(`[SOTI Auth] Attempting to get token from: ${tokenUrl}`);

        const response = await fetchWithTimeout(tokenUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authString}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                grant_type: 'password',
                username: username,
                password: password
            }).toString()
        });
        
        console.log(`[SOTI Auth] Response status: ${response.status}`);
        const data = await parseResponse(response, 'Authentication failed');
        console.log(`[SOTI Auth] Successfully obtained token`);
        return { success: true, token: data.access_token };
    } catch (error) {
        console.error(`[SOTI Auth] Error:`, error.message);
        return { success: false, error: error.message };
    }
});

// Get device groups
ipcMain.handle('soti:getGroups', async (event, serverUrl, token) => {
    try {
        if (E2E_MOCK_API) {
            if (mockApiState.scenario === 'groupError') {
                return { success: false, error: 'Failed to fetch groups: 500' };
            }
            return { success: true, groups: mockApiState.groups };
        }

        const validatedUrl = validateServerUrl(serverUrl);
        const url = `${validatedUrl}/MobiControl/api/devicegroups?take=1000`;

        const response = await fetchWithTimeout(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await parseResponse(response, 'Failed to fetch groups');
        return { success: true, groups: data };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Get custom attribute definitions
ipcMain.handle('soti:getCustomAttributes', async (event, serverUrl, token) => {
    try {
        if (E2E_MOCK_API) {
            return { success: true, attributes: mockApiState.customAttributes };
        }

        const validatedUrl = validateServerUrl(serverUrl);
        const url = `${validatedUrl}/MobiControl/api/customAttributes?take=1000`;

        const response = await fetchWithTimeout(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await parseResponse(response, 'Failed to fetch custom attributes');
        return { success: true, attributes: data };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Get group custom data
ipcMain.handle('soti:getGroupCustomData', async (event, serverUrl, token, groupPath) => {
    try {
        if (E2E_MOCK_API) {
            return { success: true, data: mockApiState.customAttributes };
        }

        const validatedUrl = validateServerUrl(serverUrl);
        const encodedPath = encodeURIComponent(groupPath);
        const url = `${validatedUrl}/MobiControl/api/devicegroups/${encodedPath}/customAttributes`;
        
        const response = await fetchWithTimeout(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await parseResponse(response, 'Failed to fetch group data');
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Create custom attribute definition
ipcMain.handle('soti:createCustomAttribute', async (event, serverUrl, token, attributeData) => {
    try {
        if (E2E_MOCK_API) {
            mockApiState.customAttributes.push({
                Name: attributeData.Name,
                Value: '',
                DataType: attributeData.CustomAttributeDataType || 'String'
            });
            return { success: true, data: attributeData };
        }

        const validatedUrl = validateServerUrl(serverUrl);
        const url = `${validatedUrl}/MobiControl/api/customAttributes`;

        const response = await fetchWithTimeout(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(attributeData)
        });
        
        const data = await parseResponse(response, 'Failed to create attribute');
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Set group custom attribute value
ipcMain.handle('soti:setGroupCustomAttribute', async (event, serverUrl, token, groupPath, attributeName, value) => {
    try {
        if (E2E_MOCK_API) {
            const existing = mockApiState.customAttributes.find(a => (a.Name || '').toLowerCase() === attributeName.toLowerCase());
            if (existing) existing.Value = value;
            else mockApiState.customAttributes.push({ Name: attributeName, Value: value, DataType: 'String' });
            return { success: true };
        }

        const validatedUrl = validateServerUrl(serverUrl);
        const encodedPath = encodeURIComponent(groupPath);
        const url = `${validatedUrl}/MobiControl/api/devicegroups/${encodedPath}/customAttributes`;
        
        const payload = [{
            Name: attributeName,
            Value: value
        }];
        
        const response = await fetchWithTimeout(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Failed to set attribute: ${response.status} - ${text}`);
        }
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Generic SOTI API request (for flexibility)
ipcMain.handle('soti:request', async (event, serverUrl, token, endpoint, method = 'GET', body = null) => {
    try {
        const safeEndpoint = validateApiEndpoint(endpoint);
        const safeMethod = validateHttpMethod(method);

        if (E2E_MOCK_API) {
            return mockGenericSotiRequest(safeEndpoint, safeMethod, body);
        }

        const validatedUrl = validateServerUrl(serverUrl);
        const url = `${validatedUrl}${safeEndpoint}`;
        
        const options = {
            method: safeMethod,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
        
        if (body !== null && body !== undefined && safeMethod !== 'GET') {
            // If body is already a string, don't stringify it again
            // This handles cases where we pass pre-serialized JSON or plain text values
            options.body = typeof body === 'string' ? body : JSON.stringify(body);
        }
        
        const response = await fetchWithTimeout(url, options);
        const data = await parseResponse(response);
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
});
