const { app, BrowserWindow, ipcMain, dialog, net, session } = require('electron');
const path = require('path');
const fs = require('fs');
const keytar = require('keytar');
const ini = require('ini');

// Service name for keytar (OS keychain)
const SERVICE_NAME = 'SotiCustomDataImporter';

let mainWindow;

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

async function sotiRequest(url, options = {}) {
    const response = await net.fetch(url, options);
    const text = await response.text();
    
    if (!response.ok) {
        throw new Error(`Request failed: ${response.status} - ${text}`);
    }
    
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

app.whenReady().then(() => {
    // Configure session to handle certificate errors for net.fetch
    session.defaultSession.setCertificateVerifyProc((request, callback) => {
        // Allow all certificates (for enterprise self-signed certs)
        callback(0); // 0 = OK
    });
    
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Handle certificate errors for webContents (for self-signed certificates in enterprise environments)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    // In development/enterprise environments, allow self-signed certificates
    console.log(`[Certificate] Certificate error for ${url}: ${error}`);
    event.preventDefault();
    callback(true);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// ==================== IPC Handlers ====================

// Credential Management (using OS keychain via keytar)
ipcMain.handle('credentials:save', async (event, profileName, credentials) => {
    try {
        await keytar.setPassword(SERVICE_NAME, profileName, JSON.stringify(credentials));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('credentials:get', async (event, profileName) => {
    try {
        const data = await keytar.getPassword(SERVICE_NAME, profileName);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        return null;
    }
});

ipcMain.handle('credentials:list', async () => {
    try {
        const credentials = await keytar.findCredentials(SERVICE_NAME);
        return credentials.map(c => c.account);
    } catch (error) {
        return [];
    }
});

ipcMain.handle('credentials:delete', async (event, profileName) => {
    try {
        await keytar.deletePassword(SERVICE_NAME, profileName);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// File Dialog
ipcMain.handle('dialog:openFile', async (event, filters) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: filters || [
            { name: 'CSV Files', extensions: ['csv'] }
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
            // Parse CSV with format: Name,FileName,Section,KeyName,Description
            const lines = content.split(/\r?\n/);
            let isFirstLine = true;
            
            for (const line of lines) {
                if (!line.trim()) continue;
                
                // Skip header row
                if (isFirstLine) {
                    isFirstLine = false;
                    // Check if this looks like a header (contains 'Name' or 'FileName')
                    const lowerLine = line.toLowerCase();
                    if (lowerLine.includes('name') || lowerLine.includes('filename') || lowerLine.includes('section')) {
                        continue;
                    }
                }
                
                const parts = line.split(',');
                // Expected format: Name,FileName,Section,KeyName,Description
                if (parts.length >= 4) {
                    const name = parts[0].trim();
                    const fileName = parts[1].trim();
                    const section = parts[2].trim();
                    const keyName = parts[3].trim();
                    const description = parts.length >= 5 ? parts[4].trim() : '';
                    
                    if (name && fileName && section && keyName) {
                        data[name] = {
                            type: 'ini',
                            file: fileName,
                            section: section,
                            valName: keyName,
                            description: description,
                            dataType: 'STRING'
                        };
                    }
                }
            }
        } else {
            throw new Error(`Unsupported file format: ${ext}. Only .csv is allowed.`);
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
        const tokenUrl = `${serverUrl}/MobiControl/api/token`;
        const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        
        console.log(`[SOTI Auth] Attempting to get token from: ${tokenUrl}`);
        
        const response = await net.fetch(tokenUrl, {
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
        
        const text = await response.text();
        console.log(`[SOTI Auth] Response status: ${response.status}`);
        
        if (!response.ok) {
            console.error(`[SOTI Auth] Authentication failed: ${response.status} - ${text}`);
            throw new Error(`Authentication failed: ${response.status} - ${text}`);
        }
        
        const data = JSON.parse(text);
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
        const url = `${serverUrl}/MobiControl/api/devicegroups?take=1000`;
        
        const response = await net.fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const text = await response.text();
        
        if (!response.ok) {
            throw new Error(`Failed to fetch groups: ${response.status}`);
        }
        
        return { success: true, groups: JSON.parse(text) };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Get custom attribute definitions
ipcMain.handle('soti:getCustomAttributes', async (event, serverUrl, token) => {
    try {
        const url = `${serverUrl}/MobiControl/api/customAttributes?take=1000`;
        
        const response = await net.fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const text = await response.text();
        
        if (!response.ok) {
            throw new Error(`Failed to fetch custom attributes: ${response.status}`);
        }
        
        return { success: true, attributes: JSON.parse(text) };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Get group custom data
ipcMain.handle('soti:getGroupCustomData', async (event, serverUrl, token, groupPath) => {
    try {
        const encodedPath = encodeURIComponent(groupPath);
        const url = `${serverUrl}/MobiControl/api/devicegroups/${encodedPath}/customAttributes`;
        
        const response = await net.fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const text = await response.text();
        
        if (!response.ok) {
            throw new Error(`Failed to fetch group data: ${response.status}`);
        }
        
        return { success: true, data: JSON.parse(text) };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Create custom attribute definition
ipcMain.handle('soti:createCustomAttribute', async (event, serverUrl, token, attributeData) => {
    try {
        const url = `${serverUrl}/MobiControl/api/customAttributes`;
        
        const response = await net.fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(attributeData)
        });
        
        const text = await response.text();
        
        if (!response.ok) {
            throw new Error(`Failed to create attribute: ${response.status} - ${text}`);
        }
        
        return { success: true, data: text ? JSON.parse(text) : null };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Set group custom attribute value
ipcMain.handle('soti:setGroupCustomAttribute', async (event, serverUrl, token, groupPath, attributeName, value) => {
    try {
        const encodedPath = encodeURIComponent(groupPath);
        const url = `${serverUrl}/MobiControl/api/devicegroups/${encodedPath}/customAttributes`;
        
        const payload = [{
            Name: attributeName,
            Value: value
        }];
        
        const response = await net.fetch(url, {
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
        const url = `${serverUrl}${endpoint}`;
        
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
        
        if (body && method !== 'GET') {
            // If body is already a string, don't stringify it again
            // This handles cases where we pass pre-serialized JSON or plain text values
            options.body = typeof body === 'string' ? body : JSON.stringify(body);
        }
        
        const response = await net.fetch(url, options);
        const text = await response.text();
        
        if (!response.ok) {
            throw new Error(`Request failed: ${response.status} - ${text}`);
        }
        
        try {
            return { success: true, data: JSON.parse(text) };
        } catch {
            return { success: true, data: text };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
});
