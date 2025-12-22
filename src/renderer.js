// ==================== State Management ====================
const state = {
    isConnected: false,
    token: null,
    serverUrl: null,
    groups: [],
    selectedGroups: [],
    dataItems: [],
    currentProfile: null,
    theme: localStorage.getItem('theme') || 'system',
    currentlyViewedGroup: null, // Track which group's data is currently displayed
    expandedGroups: new Set() // Track which groups are expanded in the tree
};

// ==================== DOM Elements ====================
const elements = {
    // Theme
    themeSelect: document.getElementById('theme-select'),

    // Status Bar
    statusBar: document.getElementById('status-bar'),
    statusText: document.getElementById('status-text'),

    // Connection
    connectionStatus: document.getElementById('connection-status'),
    connectionText: document.getElementById('connection-text'),
    profileSelect: document.getElementById('profile-select'),
    serverUrl: document.getElementById('server-url'),
    clientId: document.getElementById('client-id'),
    clientSecret: document.getElementById('client-secret'),
    username: document.getElementById('username'),
    password: document.getElementById('password'),
    connectBtn: document.getElementById('connect-btn'),
    saveProfileBtn: document.getElementById('save-profile-btn'),
    deleteProfileBtn: document.getElementById('delete-profile-btn'),
    renameProfileBtn: document.getElementById('rename-profile-btn'),
    newProfileBtn: document.getElementById('new-profile-btn'),

    // Groups
    groupList: document.getElementById('group-list'),
    groupSearch: document.getElementById('group-search'),
    refreshGroupsBtn: document.getElementById('refresh-groups-btn'),
    refreshGroupBtn: document.getElementById('refresh-group-btn'),

    // Selection
    selectAllBtn: document.getElementById('select-all-btn'),
    deselectAllBtn: document.getElementById('deselect-all-btn'),
    selectionCount: document.getElementById('selection-count'),

    // Manual Entry
    propName: document.getElementById('prop-name'),
    propType: document.getElementById('prop-type'),
    propDataType: document.getElementById('prop-datatype'),
    propDesc: document.getElementById('prop-desc'),

    // Dynamic Sections
    fieldsIni: document.getElementById('fields-ini'),

    // INI Inputs
    iniFile: document.getElementById('ini-file'),
    iniSection: document.getElementById('ini-section'),
    iniValName: document.getElementById('ini-val-name'),

    addManualBtn: document.getElementById('add-manual-btn'),

    // Predefined Data Picker
    predefinedSearch: document.getElementById('predefined-search'),
    predefinedPickerContent: document.getElementById('predefined-picker-content'),
    expandAllBtn: document.getElementById('expand-all-btn'),
    collapseAllBtn: document.getElementById('collapse-all-btn'),
    addSelectedPredefinedBtn: document.getElementById('add-selected-predefined-btn'),
    predefinedSelectedCount: document.getElementById('predefined-selected-count'),

    // XSight Agent Data Picker
    xsightSearch: document.getElementById('xsight-search'),
    xsightPickerContent: document.getElementById('xsight-picker-content'),
    xsightItemsList: document.getElementById('xsight-items-list'),
    xsightSelectAllBtn: document.getElementById('xsight-select-all-btn'),
    xsightSelectNoneBtn: document.getElementById('xsight-select-none-btn'),
    addXsightSelectedBtn: document.getElementById('add-xsight-selected-btn'),
    xsightSelectedCount: document.getElementById('xsight-selected-count'),

    // Data Grid
    dataTableBody: document.getElementById('data-table-body'),
    itemCount: document.getElementById('item-count'),

    // Actions
    clearAllBtn: document.getElementById('clear-all-btn'),
    applyBtn: document.getElementById('apply-btn'),

    // Save Profile Modal
    saveProfileModal: document.getElementById('save-profile-modal'),
    profileNameInput: document.getElementById('profile-name'),
    cancelSaveBtn: document.getElementById('cancel-save-btn'),
    confirmSaveBtn: document.getElementById('confirm-save-btn'),

    // Rename Profile Modal
    renameProfileModal: document.getElementById('rename-profile-modal'),
    renameProfileNameInput: document.getElementById('rename-profile-name'),
    cancelRenameBtn: document.getElementById('cancel-rename-btn'),
    confirmRenameBtn: document.getElementById('confirm-rename-btn'),

    // Toast
    toastContainer: document.getElementById('toast-container')
};

// ==================== Toast Notifications ====================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${getToastIcon(type)}</span> ${message}`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function getToastIcon(type) {
    switch (type) {
        case 'success': return '✓';
        case 'error': return '✕';
        default: return 'ℹ';
    }
}

// ==================== Tab Navigation ====================
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));

        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
    });
});

// ==================== Profile Management ====================
async function loadProfiles() {
    try {
        const profiles = await window.api.credentials.list();
        elements.profileSelect.innerHTML = '<option value="">-- Select Saved Profile --</option>';
        profiles.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            elements.profileSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load profiles:', error);
    }
}

async function loadProfile(profileName) {
    const credentials = await window.api.credentials.get(profileName);
    if (credentials) {
        elements.serverUrl.value = credentials.serverUrl || '';
        elements.clientId.value = credentials.clientId || '';
        elements.clientSecret.value = credentials.clientSecret || '';
        elements.username.value = credentials.username || '';
        elements.password.value = credentials.password || '';
        state.currentProfile = profileName;
    }
}

elements.profileSelect.addEventListener('change', async () => {
    const profileName = elements.profileSelect.value;
    if (profileName) {
        await loadProfile(profileName);
        showToast(`Loaded profile: ${profileName}`, 'info');

        // AUTO-CONNECT: As requested, refresh/connect immediately
        await connectToServer();
    } else {
        clearCredentialForm();
    }
});

elements.newProfileBtn.addEventListener('click', () => {
    elements.profileSelect.value = "";
    clearCredentialForm();
    showToast('Fields cleared for new connection', 'info');
});

// ==================== URL Auto-Correction ====================
function fixServerUrl(url) {
    if (!url) return url;
    
    let fixed = url.trim();
    
    // Remove trailing slashes
    fixed = fixed.replace(/\/+$/, '');
    
    // If no protocol, add https://
    if (!fixed.match(/^https?:\/\//i)) {
        // Remove any malformed protocol prefix (like http:/ or https:/ without double slash)
        fixed = fixed.replace(/^https?:?\/?/i, '');
        fixed = 'https://' + fixed;
    }
    
    // Convert http:// to https://
    if (fixed.toLowerCase().startsWith('http://')) {
        fixed = 'https://' + fixed.substring(7);
    }
    
    return fixed;
}

// Auto-fix URL when user leaves the field
elements.serverUrl.addEventListener('blur', () => {
    const url = elements.serverUrl.value.trim();
    if (url) {
        const fixed = fixServerUrl(url);
        if (fixed !== url) {
            elements.serverUrl.value = fixed;
            console.log(`[URL Fix] Corrected "${url}" to "${fixed}"`);
        }
    }
});

elements.saveProfileBtn.addEventListener('click', () => {
    // Auto-fix the URL before showing modal
    if (elements.serverUrl.value.trim()) {
        elements.serverUrl.value = fixServerUrl(elements.serverUrl.value);
    }
    
    // Pre-fill with current profile name if editing, or suggest based on server URL
    if (state.currentProfile) {
        elements.profileNameInput.value = state.currentProfile;
    } else {
        // Suggest a name based on the server URL
        const serverUrl = elements.serverUrl.value.trim();
        if (serverUrl) {
            try {
                const hostname = new URL(serverUrl).hostname;
                // Use first part of hostname as suggestion (e.g., "benelux" from "benelux.mobicontrol.cloud")
                elements.profileNameInput.value = hostname.split('.')[0] || '';
            } catch {
                elements.profileNameInput.value = '';
            }
        } else {
            elements.profileNameInput.value = '';
        }
    }
    elements.saveProfileModal.style.display = 'flex';
    // Focus the input after a brief delay (for animation)
    setTimeout(() => elements.profileNameInput.focus(), 100);
});

elements.cancelSaveBtn.addEventListener('click', () => {
    elements.saveProfileModal.style.display = 'none';
});

// Handle Enter key in profile name input
elements.profileNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        elements.confirmSaveBtn.click();
    } else if (e.key === 'Escape') {
        elements.saveProfileModal.style.display = 'none';
    }
});

// Close modal when clicking overlay background
elements.saveProfileModal.addEventListener('click', (e) => {
    if (e.target === elements.saveProfileModal) {
        elements.saveProfileModal.style.display = 'none';
    }
});

async function saveProfile() {
    const profileName = elements.profileNameInput.value.trim();
    if (!profileName) {
        showToast('Please enter a profile name', 'error');
        elements.profileNameInput.focus();
        return;
    }

    // Validate that at least server URL is filled
    if (!elements.serverUrl.value.trim()) {
        showToast('Please enter a server URL before saving', 'error');
        elements.saveProfileModal.style.display = 'none';
        elements.serverUrl.focus();
        return;
    }

    // Fix the URL before saving
    const fixedUrl = fixServerUrl(elements.serverUrl.value);
    elements.serverUrl.value = fixedUrl;

    const credentials = {
        serverUrl: fixedUrl,
        clientId: elements.clientId.value.trim(),
        clientSecret: elements.clientSecret.value,
        username: elements.username.value.trim(),
        password: elements.password.value
    };

    console.log(`[Save Profile] Saving profile "${profileName}" with server: ${fixedUrl}`);

    try {
        const result = await window.api.credentials.save(profileName, credentials);
        console.log(`[Save Profile] Result:`, result);
        
        if (result.success) {
            showToast(`Profile "${profileName}" saved securely`, 'success');
            elements.saveProfileModal.style.display = 'none';
            state.currentProfile = profileName;
            await loadProfiles();
            elements.profileSelect.value = profileName;
        } else {
            showToast(`Failed to save: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error(`[Save Profile] Error:`, error);
        showToast(`Failed to save profile: ${error.message}`, 'error');
    }
}

elements.confirmSaveBtn.addEventListener('click', saveProfile);

elements.deleteProfileBtn.addEventListener('click', async () => {
    const profileName = elements.profileSelect.value;
    if (!profileName) {
        showToast('Select a profile to delete', 'error');
        return;
    }

    if (confirm(`Delete profile "${profileName}"?`)) {
        await window.api.credentials.delete(profileName);
        showToast(`Deleted profile: ${profileName}`, 'success');
        await loadProfiles();
        clearCredentialForm();
    }
});

// ==================== Rename Profile ====================
elements.renameProfileBtn.addEventListener('click', () => {
    const profileName = elements.profileSelect.value;
    if (!profileName) {
        showToast('Select a profile to rename', 'error');
        return;
    }
    
    // Pre-fill with current name
    elements.renameProfileNameInput.value = profileName;
    elements.renameProfileModal.style.display = 'flex';
    setTimeout(() => elements.renameProfileNameInput.focus(), 100);
    elements.renameProfileNameInput.select();
});

elements.cancelRenameBtn.addEventListener('click', () => {
    elements.renameProfileModal.style.display = 'none';
});

elements.renameProfileNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        elements.confirmRenameBtn.click();
    } else if (e.key === 'Escape') {
        elements.renameProfileModal.style.display = 'none';
    }
});

// Close modal when clicking overlay background
elements.renameProfileModal.addEventListener('click', (e) => {
    if (e.target === elements.renameProfileModal) {
        elements.renameProfileModal.style.display = 'none';
    }
});

elements.confirmRenameBtn.addEventListener('click', async () => {
    const oldName = elements.profileSelect.value;
    const newName = elements.renameProfileNameInput.value.trim();
    
    if (!newName) {
        showToast('Please enter a new name', 'error');
        return;
    }
    
    if (newName === oldName) {
        elements.renameProfileModal.style.display = 'none';
        return;
    }
    
    try {
        // Get existing credentials
        const credentials = await window.api.credentials.get(oldName);
        if (!credentials) {
            showToast('Could not read profile data', 'error');
            return;
        }
        
        // Save with new name
        await window.api.credentials.save(newName, credentials);
        
        // Delete old profile
        await window.api.credentials.delete(oldName);
        
        // Update current profile state
        state.currentProfile = newName;
        
        // Reload profiles and select the renamed one
        await loadProfiles();
        elements.profileSelect.value = newName;
        
        elements.renameProfileModal.style.display = 'none';
        showToast(`Renamed profile to "${newName}"`, 'success');
    } catch (error) {
        console.error('Error renaming profile:', error);
        showToast(`Failed to rename profile: ${error.message}`, 'error');
    }
});

function clearCredentialForm() {
    elements.serverUrl.value = '';
    elements.clientId.value = '';
    elements.clientSecret.value = '';
    elements.username.value = '';
    elements.password.value = '';
    state.currentProfile = null;
}

// ==================== SOTI API Integration ====================
// All API calls are routed through the main process to bypass CORS restrictions

async function getSotiToken(serverUrl, clientId, clientSecret, username, password) {
    const result = await window.api.soti.getToken(serverUrl, clientId, clientSecret, username, password);
    if (!result.success) {
        throw new Error(result.error || 'Authentication failed');
    }
    return result.token;
}

async function getSotiGroups(serverUrl, token) {
    const result = await window.api.soti.getGroups(serverUrl, token);
    if (!result.success) {
        throw new Error(result.error || 'Failed to fetch groups');
    }
    const data = result.groups;
    return Array.isArray(data) ? data : (data.items || data);
}

// Helper function for generic SOTI API requests via main process
async function sotiApiRequest(serverUrl, token, endpoint, method = 'GET', body = null) {
    const result = await window.api.soti.request(serverUrl, token, endpoint, method, body);
    if (!result.success) {
        throw new Error(result.error || 'API request failed');
    }
    return result.data;
}

// ==================== CustomData Definitions API ====================
async function getCustomDataDefinitions(serverUrl, token) {
    // GET /api/customdata - Returns list of all custom data property definitions
    try {
        const data = await sotiApiRequest(serverUrl, token, '/MobiControl/api/customdata');
        return Array.isArray(data) ? data : (data.items || []);
    } catch (error) {
        console.warn('Failed to fetch custom data definitions:', error);
        return [];
    }
}

async function createCustomDataDefinition(serverUrl, token, definition) {
    // POST /api/customdata - Create a new CustomData property definition
    console.log(`[SOTI API] Creating CustomData definition:`, definition);

    try {
        const result = await sotiApiRequest(serverUrl, token, '/MobiControl/api/customdata', 'POST', definition);
        console.log(`[SOTI API] Successfully created CustomData definition:`, result);
        return result;
    } catch (error) {
        console.error(`[SOTI API] Error creating CustomData definition:`, error);
        throw error;
    }
}

async function ensureCustomDataDefinitionExists(serverUrl, token, item) {
    // Check the item type - SOTI API does NOT support creating XML or JSON CustomData definitions programmatically
    // These types must be created manually in the SOTI web console
    const itemType = item.value?.type?.toLowerCase();
    if (itemType === 'xml') {
        console.warn(`[SOTI API] XML CustomData definitions cannot be created via the API.`);
        console.warn(`[SOTI API] Please create the definition for "${item.key}" manually in the SOTI web console.`);
        console.warn(`[SOTI API] The configuration will still be saved to CustomDataConfig for reference.`);
        return { 
            created: false, 
            name: item.key, 
            skipped: true, 
            warning: `XML CustomData definition "${item.key}" must be created manually in SOTI web console. Config saved for reference.` 
        };
    }
    if (itemType === 'json') {
        console.warn(`[SOTI API] JSON CustomData definitions cannot be created via the API.`);
        console.warn(`[SOTI API] Please create the definition for "${item.key}" manually in the SOTI web console.`);
        console.warn(`[SOTI API] The configuration will still be saved to CustomDataConfig for reference.`);
        return { 
            created: false, 
            name: item.key, 
            skipped: true, 
            warning: `JSON CustomData definition "${item.key}" must be created manually in SOTI web console. Config saved for reference.` 
        };
    }

    // Check if CustomData definition exists, create if not
    const definitions = await getCustomDataDefinitions(serverUrl, token);
    const exists = definitions.some(d =>
        (d.name || d.Name || '').toLowerCase() === item.key.toLowerCase()
    );

    if (exists) {
        console.log(`CustomData definition already exists: ${item.key}`);
        return { created: false, name: item.key, exists: true };
    }

    // Check existing definitions to determine correct format, DeviceFamily/PhysicalType values, and expression format
    // IMPORTANT: PhysicalType is the DATA TYPE (String, Numeric, etc.), NOT a device platform!
    // DeviceFamily is the device platform (AndroidPlus, etc.)
    let deviceFamily = 'AndroidPlus'; // Default to AndroidPlus for Android devices
    let physicalType = 'String'; // PhysicalType is the DATA TYPE, default to String
    let deviceKinds = ['AndroidPlus', 'AndroidElm', 'AndroidForWork', 'AndroidKnox']; // Default device kinds
    let expressionFormat = null; // Will store example expression format from existing definitions

    // Valid data types for PhysicalType field
    const validPhysicalTypes = ['String', 'Numeric', 'Date', 'Boolean', 'Integer', 'Float', 'Text'];

    if (definitions.length > 0) {
        // Use values from first existing definition as reference
        const sample = definitions[0];
        console.log(`[SOTI API] Sample existing CustomData definition:`, JSON.stringify(sample, null, 2));

        // Check for DeviceFamily (the device platform - AndroidPlus, iOS, Windows, etc.)
        const deviceFamilyValue = sample.DeviceFamily || sample.deviceFamily;
        if (deviceFamilyValue && typeof deviceFamilyValue === 'string') {
            deviceFamily = deviceFamilyValue.trim();
            console.log(`[SOTI API] Using DeviceFamily from existing definition: ${deviceFamily}`);
        }

        // Check for PhysicalType (this is the DATA TYPE - String, Numeric, etc., NOT device type!)
        const physicalTypeValue = sample.PhysicalType || sample.physicalType;
        if (physicalTypeValue && typeof physicalTypeValue === 'string') {
            physicalType = physicalTypeValue.trim();
            console.log(`[SOTI API] Using PhysicalType from existing definition: ${physicalType}`);
        }

        // Check for DeviceKinds array
        const deviceKindsValue = sample.DeviceKinds || sample.deviceKinds;
        if (deviceKindsValue && Array.isArray(deviceKindsValue) && deviceKindsValue.length > 0) {
            deviceKinds = deviceKindsValue;
            console.log(`[SOTI API] Using DeviceKinds from existing definition: ${JSON.stringify(deviceKinds)}`);
        }

        // Check expression format from existing definition
        if (sample.expression || sample.Expression) {
            expressionFormat = sample.expression || sample.Expression;
            console.log(`[SOTI API] Found example expression format: ${expressionFormat}`);
        }

        // Log what we found
        console.log(`[SOTI API] Extracted from existing definitions - DeviceFamily: ${deviceFamily}, PhysicalType: ${physicalType}, DeviceKinds: ${JSON.stringify(deviceKinds)}`);

        // DEBUG: Log ALL properties to find the correct "enabled" field name
        console.log(`[SOTI API] ALL PROPERTIES of existing definition:`, Object.keys(sample));
        console.log(`[SOTI API] Enabled-related properties:`);
        Object.keys(sample).forEach(key => {
            if (key.toLowerCase().includes('enable') || key.toLowerCase().includes('active') || key.toLowerCase().includes('status')) {
                console.log(`  -> ${key}: ${sample[key]}`);
            }
        });
    } else {
        console.log(`[SOTI API] No existing CustomData definitions found, using defaults: DeviceFamily=${deviceFamily}, PhysicalType=${physicalType}`);
    }

    // Get item value early so we can use its properties
    const value = item.value;

    // SOTI CustomData definitions ONLY accept "String" as PhysicalType
    physicalType = 'String';
    console.log(`[SOTI API] Using PhysicalType: String (SOTI CustomData only supports String)`);
    
    // Build the definition based on the item type
    // Use capital field names to match existing SOTI API format
    let definition = {
        Name: item.key,  // Capital N to match existing format
        Description: value.description || '',
        PhysicalType: physicalType,  // SOTI CustomData only accepts 'String'
        DeviceFamily: deviceFamily,  // This is the device platform (AndroidPlus, etc.)
        DeviceKinds: deviceKinds,    // Array of supported device kinds
        Enabled: true                // Ensure custom data is ACTIVE by default (API uses 'Enabled' not 'IsEnabled')
    };

    // Build the Expression field based on the item type
    // NOTE: The existing definition shows Expression uses protocol prefixes (INI://, XML://, etc.)
    // and there's NO separate buildType field - the type is inferred from the Expression format
    if (value.type === 'ini') {
        const file = value.file || '';
        const section = value.section || '';
        const valName = value.valName || '';

        // Build the expression using INI:// protocol format: INI://<FileName>?SC=<SectionName>&NM=<ValueName>
        // Expression is REQUIRED and cannot be empty
        let expression = '';
        if (file && section && valName) {
            expression = `INI://${file}?SC=${section}&NM=${valName}`;
        } else if (file && section) {
            expression = `INI://${file}?SC=${section}`;
        } else if (file) {
            expression = `INI://${file}`;
        } else {
            // Fallback: use a minimal expression
            expression = `INI:///sdcard/${item.key}.ini?SC=${section || 'Default'}&NM=${valName || 'Value'}`;
            console.warn(`[SOTI API] Missing file path for INI, using fallback expression: ${expression}`);
        }
        definition.Expression = expression;

    } else if (value.type === 'xml') {
        const file = value.file || '';
        const xpath = value.xpath || '';

        // Build the expression for XML - SOTI uses XML:// protocol
        // Format: XML://<FilePath>?<XPathExpression>
        let expression = '';
        if (file && xpath) {
            // XML expression format: XML://FilePath?XPathExpression (no XPATH= prefix)
            expression = `XML://${file}?${xpath}`;
        } else if (file) {
            expression = `XML://${file}`;
        } else {
            // Fallback
            expression = `XML:///sdcard/${item.key}.xml?/`;
            console.warn(`[SOTI API] Missing file/xpath for XML, using fallback expression: ${expression}`);
        }
        definition.Expression = expression;

    } else {
        // Static type - use STATIC:// protocol or just the value
        const staticVal = value.value !== undefined ? value.value : '';

        // For static, the expression might just be the literal value
        definition.Expression = String(staticVal || item.key);
    }

    // Ensure Expression is never empty (required field)
    if (!definition.Expression || definition.Expression.trim() === '') {
        console.warn(`[SOTI API] Expression is empty for ${item.key}, using fallback`);
        definition.Expression = item.key; // Use the name as fallback
    }

    console.log(`Creating CustomData definition for ${item.key}`);
    console.log(`[SOTI API] Using DeviceFamily: ${deviceFamily}, PhysicalType: ${physicalType}`);
    console.log(`[SOTI API] Expression: ${definition.Expression}`);
    console.log(`[SOTI API] DeviceKinds: ${JSON.stringify(definition.DeviceKinds)}`);

    try {
        await createCustomDataDefinition(serverUrl, token, definition);
        return { created: true, name: item.key };
    } catch (err) {
        // Check if the error is "already exists" - this is actually a success case
        if (err.message && err.message.toLowerCase().includes('already exists')) {
            console.log(`CustomData definition "${item.key}" already exists (detected from API response)`);
            return { created: false, name: item.key, exists: true };
        }
        console.warn(`Could not create CustomData definition ${item.key}:`, err.message);
        console.warn(`[SOTI API] Full definition that failed:`, JSON.stringify(definition, null, 2));
        return { created: false, name: item.key, error: err.message };
    }
}

// ==================== Enable CustomData on Group ====================
// Note: The SOTI API does not provide a direct endpoint to enable CustomData on groups.
// CustomData definitions are created globally and then enabled on groups via the SOTI console's
// CustomData Manager or through profile configurations. This function attempts to enable it
// but will gracefully fail if not supported.
async function enableCustomDataOnGroup(serverUrl, token, groupPath, customDataName) {
    // The SOTI API doesn't have a direct endpoint to enable CustomData on groups.
    // CustomData is primarily device-level and gets enabled through:
    // 1. The SOTI Console's CustomData Manager UI (Available Items -> Displayed Items)
    // 2. Profile/Configuration assignments
    //
    // We'll try a few potential endpoints, but expect this to fail in most cases.
    const encodedPath = encodeURIComponent(groupPath);
    const encodedName = encodeURIComponent(customDataName);
    
    console.log(`[SOTI API] Attempting to enable CustomData "${customDataName}" on group "${groupPath}"`);
    
    // Try 1: Check if there's an advancedConfigurations endpoint
    try {
        const configs = await sotiApiRequest(serverUrl, token, `/MobiControl/api/devicegroups/${encodedPath}/configurations`);
        console.log(`[SOTI API] Group configurations available:`, configs);
        // If we get here, we might be able to enable CustomData via configurations
        // But we don't have documentation on the exact format needed
    } catch (e) {
        console.log(`[SOTI API] Configurations endpoint not available: ${e.message}`);
    }
    
    // Since there's no known API endpoint to enable CustomData on groups,
    // return a "not supported" result with helpful guidance
    return {
        success: false,
        error: `Enabling CustomData on groups via API is not directly supported by SOTI. ` +
               `The definition "${customDataName}" was created successfully. ` +
               `To enable it on this group, please use the SOTI Console: ` +
               `Devices > select group > Settings > Device Info Panel > CustomData Manager > ` +
               `move "${customDataName}" from Available Items to Displayed Items.`
    };
}

// ==================== Custom Attribute Definitions API ====================
async function getCustomAttributeDefinitions(serverUrl, token) {
    // GET /customattributes - Returns list of all custom attribute definitions
    try {
        const data = await sotiApiRequest(serverUrl, token, '/MobiControl/api/customattributes');
        return Array.isArray(data) ? data : (data.items || []);
    } catch (error) {
        console.warn('Failed to fetch custom attribute definitions:', error);
        return [];
    }
}

async function createCustomAttributeDefinition(serverUrl, token, definition) {
    // POST /customattributes - Create a new custom attribute definition
    // Reverted to Custom Attributes because this is the correct API for Group-assignable metadata
    return await sotiApiRequest(serverUrl, token, '/MobiControl/api/customattributes', 'POST', definition);
}

async function ensureCustomAttributeExists(serverUrl, token, attributeName, dataType = 'Text') {
    // Check if attribute exists, create if not
    const definitions = await getCustomAttributeDefinitions(serverUrl, token);
    const exists = definitions.some(d =>
        (d.name || d.Name || '').toLowerCase() === attributeName.toLowerCase()
    );

    if (!exists) {
        console.log(`Creating custom attribute definition: ${attributeName}`);
        try {
            await createCustomAttributeDefinition(serverUrl, token, {
                Name: attributeName,
                CustomAttributeDataType: dataType, // REQUIRED: was DataType
                PropagateToDevice: true, // REQUIRED: Missing before
                Description: "Created by CustomDataImporter"
            });
            return { created: true, name: attributeName };
        } catch (err) {
            // Check if the error is "already exists" - this is actually a success case
            if (err.message && err.message.toLowerCase().includes('already exists')) {
                console.log(`Custom attribute "${attributeName}" already exists (detected from API response)`);
                return { created: false, name: attributeName, exists: true };
            }
            console.warn(`Could not create attribute ${attributeName}:`, err.message);
            return { created: false, name: attributeName, error: err.message };
        }
    }

    return { created: false, name: attributeName, exists: true };
}

async function getGroupCustomData(serverUrl, token, groupPath) {
    // SOTI API uses URL-encoded path for device groups
    // Endpoint: GET /devicegroups/{path}
    const encodedPath = encodeURIComponent(groupPath);

    try {
        const group = await sotiApiRequest(serverUrl, token, `/MobiControl/api/devicegroups/${encodedPath}`);

        // Prepare result structure
        const result = {
            config: [],
            attributes: [],
            inheritance: group.AreCustomAttributesInherited
        };
        console.log(`Group ${groupPath} - Inheritance: ${group.AreCustomAttributesInherited}`);

        // 2. Fetch explicit Custom Attributes list
        // Research confirms "Asset Tag", "Store #" etc are Custom Attributes.
        // We revert to this endpoint because 'customData' endpoint returned 404/Empty.
        let directAttributes = [];
        try {
            directAttributes = await sotiApiRequest(serverUrl, token, `/MobiControl/api/devicegroups/${encodedPath}/customAttributes`);
            console.log(`Explicitly fetched ${directAttributes.length} custom attributes.`);
        } catch (e) {
            console.warn('Failed to fetch explicit custom attributes:', e);
        }

        // Merge attributes found in group object with explicit list
        const groupAttrs = group.CustomAttributes || group.customAttributes || [];

        // Helper to find the value property in a SOTI attribute object
        const getAttrValue = (attr) => {
            // SOTI API casing and property names can vary by version
            // Log all keys to help debug
            console.log(`[getAttrValue] Raw attribute object:`, JSON.stringify(attr, null, 2));
            
            if (attr.Value !== undefined && attr.Value !== null) return attr.Value;
            if (attr.value !== undefined && attr.value !== null) return attr.value;
            if (attr.CustomAttributeValue !== undefined && attr.CustomAttributeValue !== null) return attr.CustomAttributeValue;
            if (attr.StringValue !== undefined && attr.StringValue !== null) return attr.StringValue;
            // Also check for 'AttributeValue' which some SOTI versions use
            if (attr.AttributeValue !== undefined && attr.AttributeValue !== null) return attr.AttributeValue;
            if (attr.attributeValue !== undefined && attr.attributeValue !== null) return attr.attributeValue;
            return '';
        };

        // Create a map to bundle them
        const attrMap = new Map();

        [...groupAttrs, ...directAttributes].forEach(a => {
            const name = a.Name || a.name;
            if (name) {
                const val = getAttrValue(a);
                console.log(`Mapping Attribute: ${name} = "${val}" (type: ${typeof val})`);

                attrMap.set(name.toLowerCase(), {
                    Name: name,
                    Value: val,
                    DataType: a.DataType || a.dataType || 'String',
                    IsInherited: a.IsInherited || a.isInherited || false
                });
            }
        });

        // 3. Process Config vs Standard Attributes
        const configKey = 'customdataconfig';

        if (attrMap.has(configKey)) {
            const configAttr = attrMap.get(configKey);
            try {
                // Value might be already an object or a string
                let parsed = configAttr.Value;
                if (typeof parsed === 'string') {
                    parsed = JSON.parse(parsed);
                }
                result.config = Array.isArray(parsed) ? parsed : (parsed.items || []);
            } catch (e) {
                console.error('Failed to parse CustomDataConfig JSON:', e);
            }
            attrMap.delete(configKey);
        }

        // Remaining maps are standard attributes
        result.attributes = Array.from(attrMap.values());

        return result;

    } catch (error) {
        console.error('Error fetching group data:', error);
        return { config: [], attributes: [] };
    }
}

// ==================== Update Custom Attribute Value ====================
async function updateCustomAttributeValue(groupPath, attributeName, newValue, saveBtn, input) {
    if (!state.isConnected || !state.token || !state.serverUrl) {
        showToast('Not connected to server', 'error');
        return;
    }

    const originalBtnText = saveBtn.textContent;
    saveBtn.textContent = '...';
    saveBtn.disabled = true;

    try {
        const encodedPath = encodeURIComponent(groupPath);
        const encodedAttrName = encodeURIComponent(attributeName);
        const endpoint = `/MobiControl/api/devicegroups/${encodedPath}/customAttributes/${encodedAttrName}`;

        console.log(`[SOTI API] Updating custom attribute: ${attributeName} = ${newValue}`);

        await sotiApiRequest(state.serverUrl, state.token, endpoint, 'PUT', newValue);
        
        // If we reach here, the request was successful
        console.log(`✅ Successfully updated ${attributeName}`);
        showToast(`✅ Updated "${attributeName}"`, 'success');
        
        // Update the original value to the new value
        input.dataset.originalValue = newValue;
        saveBtn.textContent = '✓';
        saveBtn.classList.remove('btn-changed');
        
        // Reset button text after a moment
        setTimeout(() => {
            saveBtn.textContent = 'Save';
        }, 1500);
    } catch (error) {
        console.error(`[SOTI API] Error updating attribute:`, error);
        
        // Parse the error message for user-friendly display
        let userMessage = error.message;
        const errMsg = error.message.toLowerCase();
        
        // Check for type mismatch errors (SOTI returns 422 with ErrorCode 2056)
        if (error.message.includes('422') || error.message.includes('2056') || 
            errMsg.includes('value type is correct') || errMsg.includes('type is correct')) {
            userMessage = `Type mismatch: The value "${newValue}" is not valid for "${attributeName}". Check the attribute's data type (e.g., Integer, Boolean, Date).`;
        } else if (error.message.includes('403')) {
            userMessage = `Permission denied: You don't have access to update "${attributeName}"`;
        } else if (error.message.includes('404')) {
            userMessage = `Attribute "${attributeName}" not found on this group`;
        } else if (error.message.includes('401')) {
            userMessage = `Authentication failed. Please reconnect to the server.`;
        }
        
        showToast(`❌ ${userMessage}`, 'error');
        saveBtn.textContent = originalBtnText;
        saveBtn.disabled = false;
    }
}

async function applyCustomDataToGroup(serverUrl, token, groupId, dataItems, groupPath) {
    // SOTI API requires using the custom attributes endpoint with the group PATH
    // Endpoints:
    //   PUT /devicegroups/{path}/customAttributes - Batch update multiple attributes
    //   PUT /devicegroups/{path}/customAttributes/{name} - Update single attribute

    // Validate inputs
    if (!serverUrl || !token || !groupPath) {
        throw new Error('Missing required parameters: serverUrl, token, or groupPath');
    }

    if (!dataItems || dataItems.length === 0) {
        throw new Error('No data items to apply');
    }

    // Use the path passed in (from selectedGroups), encode it for URL
    let pathForUrl = groupPath || '';
    const encodedPath = encodeURIComponent(pathForUrl);

    console.log(`Applying ${dataItems.length} items to group path: ${pathForUrl}`);
    console.log(`Encoded path: ${encodedPath}`);

    // Separate static items (direct values) from config items (dynamic rules)
    const staticItems = dataItems.filter(item => {
        if (!item.value || typeof item.value !== 'object') {
            console.warn('Item missing value object:', item);
            return false;
        }
        return item.value.type === 'static';
    });
    const configItems = dataItems.filter(item =>
        !item.value || !item.value.type || (item.value.type !== 'existing' && item.value.type !== 'static')
    );

    console.log(`Static items: ${staticItems.length}, Config items: ${configItems.length}`);
    console.log('Static items details:', staticItems.map(item => ({
        key: item.key,
        hasValue: typeof item.value?.value !== 'undefined',
        value: item.value?.value
    })));

    let successCount = 0;
    let errors = [];
    let createdAttributes = [];
    let createdCustomDataDefinitions = [];

    // First, ensure all required CustomData definitions exist (for config items)
    // This is CRITICAL: CustomData definitions must exist before the config can be applied
    console.log('Checking CustomData definitions for config items...');
    for (const item of configItems) {
        if (!item.key) {
            console.warn('Skipping config item with missing key:', item);
            continue;
        }
        const result = await ensureCustomDataDefinitionExists(serverUrl, token, item);
        if (result.created) {
            createdCustomDataDefinitions.push(item.key);
            console.log(`✅ Created new CustomData definition: ${item.key}`);
            
            // IMPORTANT: After creating the definition, we need to ENABLE it on the group
            // The SOTI UI toggle is controlled via advancedConfigurations, not the definition itself
            console.log(`[SOTI API] Attempting to enable "${item.key}" on group via advancedConfigurations...`);
            const enableResult = await enableCustomDataOnGroup(serverUrl, token, groupPath, item.key);
            if (enableResult.success) {
                console.log(`✅ Successfully enabled "${item.key}" on group`);
            } else {
                console.warn(`⚠️ Could not enable "${item.key}" on group: ${enableResult.error}`);
                // Don't treat this as a fatal error - the definition was created successfully
            }
        } else if (result.skipped) {
            // Unsupported types (XML, JSON) - don't treat as error, just warn
            console.warn(`⚠️ Skipped CustomData definition for ${item.key}: ${result.warning}`);
            showToast(`⚠️ ${result.warning}`, 'warning');
            // Still continue - the config will be saved even if definition isn't created
        } else if (result.error) {
            errors.push(`Failed to create CustomData definition for ${item.key}: ${result.error}`);
        } else if (result.exists) {
            console.log(`CustomData definition already exists: ${item.key}`);
        }
    }

    // Second, ensure all required custom attribute definitions exist (for static items)
    console.log('Checking custom attribute definitions for static items...');
    for (const item of staticItems) {
        if (!item.key) {
            console.warn('Skipping item with missing key:', item);
            continue;
        }
        const result = await ensureCustomAttributeExists(serverUrl, token, item.key, 'Text');
        if (result.created) {
            createdAttributes.push(item.key);
            console.log(`Created new custom attribute: ${item.key}`);
        } else if (result.error) {
            errors.push(`Failed to create attribute definition for ${item.key}: ${result.error}`);
        }
    }

    // Ensure CustomDataConfig attribute exists if we have config items
    if (configItems.length > 0) {
        const configResult = await ensureCustomAttributeExists(serverUrl, token, 'CustomDataConfig', 'Text');
        if (configResult.created) {
            createdAttributes.push('CustomDataConfig');
        } else if (configResult.error) {
            errors.push(`Failed to create CustomDataConfig attribute: ${configResult.error}`);
        }
    }

    if (createdAttributes.length > 0) {
        console.log(`Created ${createdAttributes.length} new custom attribute definitions:`, createdAttributes);
    }
    if (createdCustomDataDefinitions.length > 0) {
        console.log(`Created ${createdCustomDataDefinitions.length} new CustomData definitions:`, createdCustomDataDefinitions);
    }

    // CRITICAL: Disable inheritance on this group so we can set local values
    // Otherwise SOTI might reject the update or it will just be hidden by parent values
    console.log(`Attempting to disable attribute inheritance for group: ${pathForUrl}`);
    try {
        const groupObj = await sotiApiRequest(serverUrl, token, `/MobiControl/api/devicegroups/${encodedPath}`);

        // Only update if currently inherited
        if (groupObj.AreCustomAttributesInherited !== false) {
            groupObj.AreCustomAttributesInherited = false;

            console.log(`[SOTI API] Attempting to disable inheritance via PATCH: ${pathForUrl}`);

            try {
                // Try PATCH first (partial update)
                await sotiApiRequest(serverUrl, token, `/MobiControl/api/devicegroups/${encodedPath}`, 'PATCH', { AreCustomAttributesInherited: false });
                console.log('✅ [SOTI API] Successfully disabled custom attribute inheritance.');
            } catch (patchErr) {
                // If PATCH fails, try PUT with full object
                console.log(`[SOTI API] PATCH not supported, trying PUT with full object...`);
                const groupIdForUpdate = groupObj.ReferenceId || groupObj.referenceId || groupObj.DeviceGroupId || groupObj.Id;
                if (groupIdForUpdate) {
                    try {
                        await sotiApiRequest(serverUrl, token, `/MobiControl/api/devicegroups/${groupIdForUpdate}`, 'PUT', groupObj);
                        console.log('✅ [SOTI API] Successfully disabled custom attribute inheritance via PUT.');
                    } catch (putErr) {
                        console.warn(`⚠️ [SOTI API] Failed to disable inheritance: ${putErr.message}`);
                        console.warn(`⚠️ Continuing anyway - custom attributes may still work if inheritance is already disabled or if override is set in UI`);
                    }
                }
            }
        } else {
            console.log('Inheritance already disabled.');
        }
    } catch (inhErr) {
        console.warn('Error checking/disabling inheritance:', inhErr.message);
        console.warn('Continuing anyway - custom attributes may still work');
        // Continue anyway, it might work if already disabled
    }

    // Build batch payload - try batch update first (more efficient)
    const batchPayload = [];

    // Add static items to batch
    for (const item of staticItems) {
        if (!item.key) {
            console.warn('Skipping item with missing key:', item);
            continue;
        }
        if (!item.value || typeof item.value !== 'object') {
            console.warn(`Skipping static item ${item.key}: value is not an object`, item);
            continue;
        }
        if (typeof item.value.value === 'undefined') {
            console.warn(`Skipping static item ${item.key}: missing value.value property`, item);
            continue;
        }
        batchPayload.push({
            name: item.key,
            value: item.value.value
        });
    }

    // Add CustomDataConfig to batch if present
    if (configItems.length > 0) {
        batchPayload.push({
            name: 'CustomDataConfig',
            value: JSON.stringify(configItems)
        });
    }

    // NOTE: Based on PowerShell implementation (Set-SotiGroupCustomAttribute.ps1),
    // SOTI API uses individual PUT requests for each custom attribute.
    // Batch updates may not be supported or may not persist correctly.
    // We'll use individual PUT requests for reliability.
    console.log(`[SOTI API] Using individual PUT requests (${staticItems.length} static items, ${configItems.length} config items)`);

    // Fallback: Update attributes one by one
    for (const item of staticItems) {
        if (!item.key) {
            console.warn('Skipping item with missing key in fallback:', item);
            continue;
        }
        if (!item.value || typeof item.value !== 'object') {
            console.warn(`Skipping ${item.key} in fallback: value is not an object`, item);
            continue;
        }
        if (typeof item.value.value === 'undefined') {
            console.warn(`Skipping ${item.key} in fallback: missing value.value property`, item);
            continue;
        }

        const attrName = encodeURIComponent(item.key);
        let attrValue = item.value.value;

        // Convert value to string if it's not already (SOTI custom attributes are typically strings)
        // But preserve the original type for JSON serialization
        const valueType = typeof attrValue;
        console.log(`[SOTI API] Processing attribute: ${item.key}, value type: ${valueType}, value: ${attrValue}`);

        // SOTI API endpoint for single custom attribute
        const attrUrl = `${serverUrl}/MobiControl/api/devicegroups/${encodedPath}/customAttributes/${attrName}`;

        // Prepare the body - SOTI expects the value as JSON (stringified)
        // For strings: JSON.stringify("test") = "test" (with quotes)
        // For numbers: JSON.stringify(123) = 123 (no quotes)
        // For booleans: JSON.stringify(true) = true (no quotes)
        const requestBody = JSON.stringify(attrValue);

        console.log(`[SOTI API] PUT request for attribute: ${item.key}`);
        console.log(`[SOTI API] URL: ${attrUrl}`);
        console.log(`[SOTI API] Original value: ${attrValue} (${valueType})`);
        console.log(`[SOTI API] Request body (JSON stringified): ${requestBody}`);

        try {
            // Use main process API for the request
            await sotiApiRequest(serverUrl, token, `/MobiControl/api/devicegroups/${encodedPath}/customAttributes/${encodeURIComponent(item.key)}`, 'PUT', JSON.parse(requestBody));
            successCount++;
            console.log(`✅ [SOTI API] Successfully applied PUT for: ${item.key} = ${attrValue}`);
        } catch (fetchErr) {
            console.error(`❌ [SOTI API] PUT failed for ${item.key}:`, fetchErr.message);
            const errMsg = fetchErr.message.toLowerCase();
            
            if (fetchErr.message.includes('403')) {
                errors.push(`${item.key}: Permission denied - API user may lack write access`);
            } else if (fetchErr.message.includes('404')) {
                errors.push(`${item.key}: Attribute not found - custom attribute definition may not exist`);
            } else if (fetchErr.message.includes('422') || fetchErr.message.includes('2056') || 
                       errMsg.includes('value type is correct') || errMsg.includes('type is correct')) {
                // SOTI returns 422 with ErrorCode 2056 for type mismatches
                errors.push(`${item.key}: Type mismatch - "${attrValue}" is not valid for this attribute's data type`);
            } else if (fetchErr.message.includes('400')) {
                // Check for type mismatch errors in 400 responses
                if (errMsg.includes('integer') || errMsg.includes('int32') || errMsg.includes('int64')) {
                    errors.push(`${item.key}: Type mismatch - expected an Integer value but received "${attrValue}"`);
                } else if (errMsg.includes('boolean') || errMsg.includes('bool')) {
                    errors.push(`${item.key}: Type mismatch - expected a Boolean (true/false) but received "${attrValue}"`);
                } else if (errMsg.includes('number') || errMsg.includes('decimal') || errMsg.includes('float') || errMsg.includes('double')) {
                    errors.push(`${item.key}: Type mismatch - expected a Number value but received "${attrValue}"`);
                } else if (errMsg.includes('date') || errMsg.includes('datetime')) {
                    errors.push(`${item.key}: Type mismatch - expected a Date value but received "${attrValue}"`);
                } else if (errMsg.includes('invalid') && errMsg.includes('type')) {
                    errors.push(`${item.key}: Type mismatch - the value "${attrValue}" is not valid for this attribute's data type`);
                } else if (errMsg.includes('cannot convert') || errMsg.includes('conversion')) {
                    errors.push(`${item.key}: Type mismatch - cannot convert "${attrValue}" to the required data type`);
                } else {
                    errors.push(`${item.key}: Invalid value - "${attrValue}" is not valid for this attribute`);
                }
            } else {
                errors.push(`${item.key}: ${fetchErr.message}`);
            }
        }
    }

    // Save CustomDataConfig (the dynamic rules) as a special attribute if not already saved in batch
    if (configItems.length > 0 && successCount === staticItems.length) {
        const configStr = JSON.stringify(configItems);

        console.log('[SOTI API] Saving CustomDataConfig via PUT...');
        console.log(`[SOTI API] Body length: ${configStr.length} characters`);

        try {
            // SOTI API expects a single {Name, Value} object for custom attribute update
            const payload = {
                Name: 'CustomDataConfig',
                Value: configStr
            };
            await sotiApiRequest(serverUrl, token, `/MobiControl/api/devicegroups/${encodedPath}/customAttributes`, 'PUT', payload);
            successCount++;
            console.log('✅ [SOTI API] Successfully applied PUT for CustomDataConfig');
        } catch (fetchErr) {
            console.error('❌ [SOTI API] PUT failed for CustomDataConfig:', fetchErr.message);
            errors.push(`CustomDataConfig: ${fetchErr.message}`);
        }
    }

    // Final validation
    if (errors.length > 0) {
        const errorMsg = `Partial failure. Success: ${successCount}/${dataItems.length}, Errors: ${errors.join('; ')}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    if (successCount === 0 && dataItems.length > 0) {
        throw new Error('Failed to apply any items. Please check your permissions and group path.');
    }

    console.log(`Successfully applied ${successCount} items to group ${pathForUrl}`);
    return { success: true, applied: successCount };
}

// Extracted connection logic for reuse (Auto-Connect)
async function connectToServer() {
    // Fix the URL protocol before connecting
    const serverUrl = fixServerUrl(elements.serverUrl.value);
    elements.serverUrl.value = serverUrl; // Update the field with fixed URL
    
    const clientId = elements.clientId.value.trim();
    const clientSecret = elements.clientSecret.value;
    const username = elements.username.value.trim();
    const password = elements.password.value;

    if (!serverUrl || !clientId || !clientSecret || !username || !password) {
        showToast('Please fill in all connection fields', 'error');
        return;
    }

    elements.connectBtn.disabled = true;
    elements.connectBtn.textContent = '⏳ Connecting...';

    try {
        state.token = await getSotiToken(serverUrl, clientId, clientSecret, username, password);
        state.serverUrl = serverUrl;
        state.isConnected = true;

        updateConnectionStatus(true);
        showToast('Connected successfully!', 'success');

        // Load groups
        await refreshGroups();

        // Switch to Manual Entry tab or keep current if valid
        // Actually, let's switch to a useful tab or stay put. 
        // Code originally switched to Manual Entry. Let's keep that behavior or make it flexible.
        // If we are auto-connecting, maybe we don't want to jump tabs aggressively if the user is elsewhere?
        // But for initial load, Manual Entry or Import is good.
        // Let's stick to original behavior for consistency.
        const manualTab = document.querySelector('[data-tab="manual"]');
        if (manualTab) manualTab.click();

    } catch (error) {
        console.error('Connection error:', error);
        showToast(error.message, 'error');
        updateConnectionStatus(false);
    } finally {
        elements.connectBtn.disabled = false;
        elements.connectBtn.textContent = 'Connect';
    }
}

elements.connectBtn.addEventListener('click', () => {
    connectToServer();
});

function updateConnectionStatus(connected) {
    const dot = elements.connectionStatus.querySelector('.status-dot');
    if (connected) {
        dot.classList.remove('disconnected');
        dot.classList.add('connected');
        const hostname = state.serverUrl ? new URL(state.serverUrl).hostname : 'Connected';
        // Show profile name if connected via a saved profile
        if (state.currentProfile) {
            elements.connectionText.textContent = `${hostname} (${state.currentProfile})`;
        } else {
            elements.connectionText.textContent = hostname;
        }
        elements.refreshGroupsBtn.disabled = false;
    } else {
        dot.classList.remove('connected');
        dot.classList.add('disconnected');
        elements.connectionText.textContent = 'Not Connected';
        elements.refreshGroupsBtn.disabled = true;
    }
}

// ==================== Group Management ====================
async function refreshGroups() {
    if (!state.isConnected) return;

    try {
        state.groups = await getSotiGroups(state.serverUrl, state.token);
        renderGroups(state.groups);
    } catch (error) {
        showToast(`Failed to load groups: ${error.message}`, 'error');
    }
}

function setGroupSelection(group, isSelected) {
    // Use the same ID resolution logic as in renderGroups
    const id = group.ReferenceId || group.referenceId || group.DeviceGroupId || group.Id;
    const path = group.Path || group.Name;
    const div = document.querySelector(`.group-item[data-id="${id}"]`);

    // Update UI
    if (div) {
        const checkbox = div.querySelector('.group-checkbox');

        if (isSelected) {
            div.classList.add('selected');
            // Update checkbox visual state
            if (checkbox) {
                checkbox.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path fill-rule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clip-rule="evenodd" />
                    </svg>`;
            }
        } else {
            div.classList.remove('selected');
            // Clear checkbox visual state
            if (checkbox) {
                checkbox.innerHTML = '';
            }
        }
    }

    // Update State
    if (isSelected) {
        if (!state.selectedGroups.some(g => g.path === path)) {
            state.selectedGroups.push({ id, path });
        }
    } else {
        state.selectedGroups = state.selectedGroups.filter(g => g.path !== path);
        // Clear viewing indicator if this was the currently viewed group
        if (state.currentlyViewedGroup === path) {
            state.currentlyViewedGroup = null;
            // Reset the heading to default
            const titleElement = document.getElementById('group-info-title');
            if (titleElement) {
                titleElement.textContent = 'Current Group Data';
            }
            updateCurrentlyViewedGroupIndicator();
        }
    }
}

// Build tree structure from groups
function buildGroupTree(groups) {
    const pathToNode = {};
    const rootNodes = [];

    // First pass: create all nodes
    groups.forEach(group => {
        const path = group.Path || group.Name || 'Unknown';
        const id = group.ReferenceId || group.referenceId || group.DeviceGroupId || group.Id;
        const name = path.split('\\').pop() || group.Name || '?';

        const node = {
            group,
            path,
            id,
            name,
            children: [],
            depth: 0
        };

        pathToNode[path] = node;
    });

    // Second pass: build parent-child relationships
    // Sort by path length to process parents before children
    const sortedNodes = Object.values(pathToNode).sort((a, b) => {
        const aParts = a.path.split('\\').length;
        const bParts = b.path.split('\\').length;
        return aParts - bParts;
    });

    sortedNodes.forEach(node => {
        const pathParts = node.path.split('\\');
        node.depth = pathParts.length - 1; // Depth is number of backslashes

        if (pathParts.length > 1) {
            // Has a parent - find parent path
            const parentPath = pathParts.slice(0, -1).join('\\');
            const parentNode = pathToNode[parentPath];
            if (parentNode) {
                parentNode.children.push(node);
            } else {
                // Parent not found, treat as root
                rootNodes.push(node);
            }
        } else {
            // Root node (no backslash in path)
            rootNodes.push(node);
        }
    });

    // Build tree object from root nodes
    const tree = {};
    rootNodes.forEach(rootNode => {
        tree[rootNode.path] = rootNode;
    });

    // Sort children alphabetically
    function sortChildren(node) {
        node.children.sort((a, b) => a.name.localeCompare(b.name));
        node.children.forEach(sortChildren);
    }
    Object.values(tree).forEach(sortChildren);

    return tree;
}

// Get all visible nodes (root + expanded children)
function getVisibleNodes(tree, expandedGroups) {
    const visible = [];

    function traverse(node) {
        visible.push(node);
        if (expandedGroups.has(node.path) && node.children.length > 0) {
            node.children.forEach(child => traverse(child));
        }
    }

    Object.values(tree).forEach(rootNode => traverse(rootNode));
    return visible;
}

function renderGroups(groups) {
    elements.groupList.innerHTML = '';

    if (!groups || groups.length === 0) {
        elements.groupList.innerHTML = `
            <div class="placeholder-message">
                <span class="icon">📭</span>
                <p>No groups found</p>
            </div>
        `;
        return;
    }

    // Build tree structure
    const tree = buildGroupTree(groups);

    // Get visible nodes based on expanded state
    const visibleNodes = getVisibleNodes(tree, state.expandedGroups);

    visibleNodes.forEach(node => {
        const div = document.createElement('div');
        div.className = 'group-item';

        const path = node.path;
        const id = node.id;
        const name = node.name;
        const hasChildren = node.children.length > 0;
        const isExpanded = state.expandedGroups.has(path);

        div.style.paddingLeft = `${14 + node.depth * 16}px`;
        div.dataset.path = path;
        div.dataset.id = id;

        // Chevron icon for groups with children
        if (hasChildren) {
            const chevron = document.createElement('div');
            chevron.className = 'group-chevron';
            chevron.innerHTML = isExpanded
                ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;">
                    <path d="m6 9 6 6 6-6"/>
                </svg>`
                : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 14px; height: 14px;">
                    <path d="m9 6 6 6-6 6"/>
                </svg>`;

            chevron.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleGroupExpansion(path);
            });

            div.appendChild(chevron);
        } else {
            // Spacer for groups without children to align text
            const spacer = document.createElement('div');
            spacer.className = 'group-chevron-spacer';
            div.appendChild(spacer);
        }

        // Checkbox
        const checkbox = document.createElement('div');
        checkbox.className = 'group-checkbox';
        div.appendChild(checkbox);

        // Name
        const nameSpan = document.createElement('span');
        nameSpan.className = 'group-name';
        nameSpan.textContent = name;
        div.appendChild(nameSpan);

        // Restore selection state
        const isSelected = state.selectedGroups.some(g => g.path === path);
        if (isSelected) {
            div.classList.add('selected');
            checkbox.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fill-rule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clip-rule="evenodd" />
                </svg>`;
        }

        // Mark currently viewed group
        if (state.currentlyViewedGroup === path) {
            div.classList.add('viewing');
        }

        elements.groupList.appendChild(div);

        // Add click listener for selection (but not on chevron)
        div.addEventListener('click', (e) => {
            // Skip if clicking on chevron
            if (e.target.closest('.group-chevron')) {
                return;
            }

            e.stopPropagation();

            const isCurrentlySelected = div.classList.contains('selected');
            const isSelected = !isCurrentlySelected;
            const clickedPath = div.dataset.path;
            const clickedId = div.dataset.id;

            // Find the group object
            const groupObj = state.groups.find(g => {
                const gPath = g.Path || g.Name;
                return gPath === clickedPath;
            }) || {
                Path: clickedPath,
                ReferenceId: clickedId,
                DeviceGroupId: clickedId,
                Id: clickedId
            };

            // Toggle selection
            setGroupSelection(groupObj, isSelected);

            // Update selection count and apply button
            updateSelectionUI();

            // Auto-fetch custom data for the clicked group when selected
            if (isSelected) {
                fetchAndDisplayGroupData(clickedPath);
            }
        });
    });

    updateSelectionUI();
    updateCurrentlyViewedGroupIndicator();
}

// Toggle group expansion state
function toggleGroupExpansion(path) {
    if (state.expandedGroups.has(path)) {
        state.expandedGroups.delete(path);
    } else {
        state.expandedGroups.add(path);
    }
    // Re-render groups to show/hide children
    renderGroups(state.groups);
}

function updateSelectionUI() {
    elements.selectionCount.textContent = `${state.selectedGroups.length} selected`;
    updateApplyButton();
}

function updateCurrentlyViewedGroupIndicator() {
    // Remove viewing class from all groups
    document.querySelectorAll('.group-item').forEach(item => {
        item.classList.remove('viewing');
    });

    // Add viewing class to currently viewed group
    if (state.currentlyViewedGroup) {
        const viewedGroup = document.querySelector(`.group-item[data-path="${CSS.escape(state.currentlyViewedGroup)}"]`);
        if (viewedGroup) {
            viewedGroup.classList.add('viewing');
        }
    }
}

elements.groupSearch.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll('.group-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query) ? '' : 'none';
    });
});

elements.refreshGroupsBtn.addEventListener('click', refreshGroups);

// Refresh currently viewed group data
elements.refreshGroupBtn.addEventListener('click', async () => {
    if (!state.isConnected) {
        showToast('Not connected to server. Please connect first.', 'error');
        return;
    }

    if (!state.currentlyViewedGroup) {
        showToast('No group selected. Please select a group to view its data.', 'info');
        return;
    }

    // Refresh the data for the currently viewed group
    await fetchAndDisplayGroupData(state.currentlyViewedGroup);
    showToast('Group data refreshed', 'success');
});

// Selection Actions
elements.selectAllBtn.addEventListener('click', () => {
    const visibleGroups = Array.from(document.querySelectorAll('.group-item'))
        .filter(item => item.style.display !== 'none');

    visibleGroups.forEach(div => {
        if (!div.classList.contains('selected')) {
            div.classList.add('selected');
            const checkbox = div.querySelector('.group-checkbox');
            if (checkbox) {
                checkbox.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path fill-rule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clip-rule="evenodd" />
                    </svg>`;
            }
            const path = div.dataset.path;
            const id = div.dataset.id;
            if (!state.selectedGroups.some(g => g.path === path)) {
                state.selectedGroups.push({ id, path });
            }
        }
    });

    updateSelectionUI();
});

elements.deselectAllBtn.addEventListener('click', () => {
    document.querySelectorAll('.group-item').forEach(div => {
        div.classList.remove('selected');
        const checkbox = div.querySelector('.group-checkbox');
        if (checkbox) {
            checkbox.innerHTML = '';
        }
    });
    state.selectedGroups = [];
    state.currentlyViewedGroup = null;
    // Reset the heading to default
    const titleElement = document.getElementById('group-info-title');
    if (titleElement) {
        titleElement.textContent = 'Current Group Data';
    }
    updateSelectionUI();
    updateCurrentlyViewedGroupIndicator();
});

// ==================== Manual Entry ====================
// Note: Only INI type is supported via SOTI API. XML and JSON must be created manually in SOTI web console.
elements.addManualBtn.addEventListener('click', () => {
    try {
        console.log('Add Property clicked');
        const name = elements.propName.value.trim();
        const type = 'ini'; // Only INI is supported via API
        const dataType = elements.propDataType.value;
        const desc = elements.propDesc.value.trim();

        console.log('Inputs:', { name, type, dataType, desc });

        if (!name) {
            showToast('Please enter a Property Name', 'error');
            return;
        }

        let itemValue = {};

        // Only INI type is supported via SOTI API
        if (!elements.iniFile || !elements.iniSection || !elements.iniValName) {
            throw new Error('INI input elements not found');
        }
        const file = elements.iniFile.value.trim();
        const section = elements.iniSection.value.trim();
        const valName = elements.iniValName.value.trim();

        if (!file || !section || !valName) {
            showToast('Please fill all INI fields', 'error');
            return;
        }
        itemValue = { type, file, section, valName };

        // Add common metadata
        itemValue.dataType = dataType;
        itemValue.description = desc;

        console.log('Adding item:', name, itemValue);

        // Add to grid (store object as value) - mark as manually added
        addDataItem(name, itemValue, true);

        // Reset Form
        elements.propName.value = '';
        elements.propDesc.value = '';
        if (elements.iniFile) elements.iniFile.value = '';
        if (elements.iniSection) elements.iniSection.value = '';
        if (elements.iniValName) elements.iniValName.value = '';

        showToast(`Added property: ${name}`, 'success');
        updateStatusBar('Property added successfully', 'success');
        setTimeout(() => hideStatusBar(), 2000);
    } catch (error) {
        console.error('Error adding property:', error);
        showToast(`Error: ${error.message}`, 'error');
        updateStatusBar('Error adding property', 'error');
    }
});

// ==================== Status Bar Management ====================
function updateStatusBar(message, type = 'info', loading = false) {
    if (!elements.statusBar) return;

    elements.statusBar.classList.add('visible');
    elements.statusText.textContent = message;

    if (loading) {
        elements.statusBar.classList.add('loading');
    } else {
        elements.statusBar.classList.remove('loading');
    }
}

function hideStatusBar() {
    if (!elements.statusBar) return;
    elements.statusBar.classList.remove('visible', 'loading');
}

// ==================== Theme Management ====================
function applyTheme(theme) {
    let effectiveTheme = theme;

    if (theme === 'system') {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    document.documentElement.setAttribute('data-theme', effectiveTheme);
    localStorage.setItem('theme', theme);
    if (elements.themeSelect) elements.themeSelect.value = theme;

    // Update visual selector
    document.querySelectorAll('.theme-option').forEach(el => el.classList.remove('active'));
    const activeOption = document.getElementById(`theme-${theme}`);
    if (activeOption) activeOption.classList.add('active');
}

if (elements.themeSelect) {
    elements.themeSelect.addEventListener('change', (e) => {
        state.theme = e.target.value;
        applyTheme(state.theme);
    });
}

// Listen for system changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (state.theme === 'system') {
        applyTheme('system');
    }
});

// ==================== Group Data Fetching ====================
// Helper function to extract enabled status from a CustomData object
function extractEnabledStatus(cd) {
    // Check all possible field names for enabled status
    if (cd.enabled !== undefined) {
        return cd.enabled === true || cd.enabled === 'true' || cd.enabled === 1;
    }
    if (cd.Enabled !== undefined) {
        return cd.Enabled === true || cd.Enabled === 'true' || cd.Enabled === 1;
    }
    if (cd.isEnabled !== undefined) {
        return cd.isEnabled === true || cd.isEnabled === 'true' || cd.isEnabled === 1;
    }
    if (cd.IsEnabled !== undefined) {
        return cd.IsEnabled === true || cd.IsEnabled === 'true' || cd.IsEnabled === 1;
    }
    if (cd.active !== undefined) {
        return cd.active === true || cd.active === 'true' || cd.active === 1;
    }
    if (cd.Active !== undefined) {
        return cd.Active === true || cd.Active === 'true' || cd.Active === 1;
    }
    // If the object exists but no enabled field, check if it's just a string (name only)
    // In that case, presence in the array means it's enabled
    if (typeof cd === 'string') {
        return true;
    }
    // Default: if object exists but no explicit enabled field, assume enabled
    return true;
}

async function fetchAndDisplayGroupData(groupPath) {
    if (!state.isConnected) return;

    // Update currently viewed group
    state.currentlyViewedGroup = groupPath;

    // Update the heading to show which group is being viewed
    const titleElement = document.getElementById('group-info-title');
    if (titleElement) {
        // Extract just the group name from the path (last part after backslash)
        const groupName = groupPath.split('\\').pop() || groupPath;
        titleElement.textContent = `Current Group Data: ${groupName}`;
    }

    // Update visual indicator for currently viewed group
    updateCurrentlyViewedGroupIndicator();

    updateStatusBar('Fetching group custom data...', 'info', true);

    // 1. Clear only items that were loaded from a previous group (preserve manually added items)
    // Manually added items have _manuallyAdded flag set to true
    state.dataItems = state.dataItems.filter(item => item._manuallyAdded === true);
    renderDataGrid();

    try {
        console.log(`Fetching CustomData definitions and group information...`);

        // Fetch CustomData definitions
        const customDataDefinitions = await getCustomDataDefinitions(state.serverUrl, state.token);
        console.log('CustomData definitions:', customDataDefinitions);

        // Fetch group object to check which CustomData are active
        const encodedPath = encodeURIComponent(groupPath);
        const groupUrl = `${state.serverUrl}/MobiControl/api/devicegroups/${encodedPath}`;
        let groupCustomDataInfo = null;
        let activeCustomDataNames = new Set();
        let activeCustomDataMap = new Map(); // Map of name -> enabled status

        try {
            // Try fetching group with fields parameter to include CustomData info
            let group = null;
            try {
                group = await sotiApiRequest(state.serverUrl, state.token, `/MobiControl/api/devicegroups/${encodedPath}?fields=CustomData`);
                console.log('Group object (with fields):', group);
            } catch (e) {
                // Fallback to normal group fetch
                try {
                    group = await sotiApiRequest(state.serverUrl, state.token, `/MobiControl/api/devicegroups/${encodedPath}`);
                    console.log('Group object (full):', group);
                    console.log('Group object keys:', Object.keys(group));
                } catch (e2) {
                    console.warn('Failed to fetch group:', e2.message);
                }
            }

            if (group) {
                // Log all keys in the group object to help debug
                console.log('Group object all keys:', Object.keys(group));
                console.log('Group object full structure:', JSON.stringify(group, null, 2));

                // Check all possible fields for CustomData configuration
                // Priority: CustomData array > EnabledCustomData array > customData array > CustomDataConfig

                // 1. Check CustomData array (most common)
                if (group.CustomData && Array.isArray(group.CustomData)) {
                    group.CustomData.forEach(cd => {
                        const name = (cd.name || cd.Name || '').toLowerCase();
                        if (name) {
                            const enabled = extractEnabledStatus(cd);
                            activeCustomDataNames.add(name);
                            activeCustomDataMap.set(name, enabled);
                            console.log(`Found CustomData: ${name} = ${enabled ? 'enabled' : 'disabled'}`);
                        }
                    });
                }

                // 2. Check EnabledCustomData array (list of enabled names)
                if (group.EnabledCustomData && Array.isArray(group.EnabledCustomData)) {
                    group.EnabledCustomData.forEach(cd => {
                        const name = typeof cd === 'string' ? cd.toLowerCase() : (cd.name || cd.Name || '').toLowerCase();
                        if (name) {
                            activeCustomDataNames.add(name);
                            activeCustomDataMap.set(name, true);
                            console.log(`Found EnabledCustomData: ${name} = enabled`);
                        }
                    });
                }

                // 3. Check customData (lowercase variant)
                if (group.customData && Array.isArray(group.customData)) {
                    group.customData.forEach(cd => {
                        const name = (cd.name || cd.Name || '').toLowerCase();
                        if (name) {
                            const enabled = extractEnabledStatus(cd);
                            activeCustomDataNames.add(name);
                            activeCustomDataMap.set(name, enabled);
                            console.log(`Found customData: ${name} = ${enabled ? 'enabled' : 'disabled'}`);
                        }
                    });
                }

                // 4. Check CustomDataConfig (stored as JSON string in custom attribute)
                if (group.CustomDataConfig) {
                    try {
                        const config = typeof group.CustomDataConfig === 'string' ?
                            JSON.parse(group.CustomDataConfig) : group.CustomDataConfig;
                        if (Array.isArray(config)) {
                            config.forEach(cd => {
                                const name = (cd.name || cd.Name || '').toLowerCase();
                                if (name) {
                                    const enabled = extractEnabledStatus(cd);
                                    activeCustomDataMap.set(name, enabled);
                                    console.log(`Found CustomDataConfig: ${name} = ${enabled ? 'enabled' : 'disabled'}`);
                                }
                            });
                        }
                    } catch (e) {
                        console.warn('Failed to parse CustomDataConfig:', e);
                    }
                }

                // 4b. Check customAttributes array in group object for CustomDataConfig
                if (group.customAttributes && Array.isArray(group.customAttributes)) {
                    const customDataConfigAttr = group.customAttributes.find(attr =>
                        (attr.name || attr.Name || '').toLowerCase() === 'customdataconfig'
                    );
                    if (customDataConfigAttr) {
                        console.log('Found CustomDataConfig in group.customAttributes:', customDataConfigAttr);
                        let configValue = customDataConfigAttr.value || customDataConfigAttr.Value ||
                            customDataConfigAttr.CustomAttributeValue;
                        if (typeof configValue === 'string') {
                            try {
                                configValue = JSON.parse(configValue);
                            } catch (e) {
                                console.warn('Failed to parse CustomDataConfig from customAttributes:', e);
                            }
                        }
                        if (Array.isArray(configValue)) {
                            configValue.forEach(cd => {
                                const name = (cd.name || cd.Name || '').toLowerCase();
                                if (name) {
                                    const enabled = extractEnabledStatus(cd);
                                    activeCustomDataMap.set(name, enabled);
                                    console.log(`Found CustomDataConfig in group.customAttributes: ${name} = ${enabled ? 'enabled' : 'disabled'}`);
                                }
                            });
                        }
                    }
                }

                // 4c. Check CustomAttributes (capitalized) array in group object
                if (group.CustomAttributes && Array.isArray(group.CustomAttributes)) {
                    const customDataConfigAttr = group.CustomAttributes.find(attr =>
                        (attr.name || attr.Name || '').toLowerCase() === 'customdataconfig'
                    );
                    if (customDataConfigAttr) {
                        console.log('Found CustomDataConfig in group.CustomAttributes:', customDataConfigAttr);
                        let configValue = customDataConfigAttr.value || customDataConfigAttr.Value ||
                            customDataConfigAttr.CustomAttributeValue;
                        if (typeof configValue === 'string') {
                            try {
                                configValue = JSON.parse(configValue);
                            } catch (e) {
                                console.warn('Failed to parse CustomDataConfig from CustomAttributes:', e);
                            }
                        }
                        if (Array.isArray(configValue)) {
                            configValue.forEach(cd => {
                                const name = (cd.name || cd.Name || '').toLowerCase();
                                if (name) {
                                    const enabled = extractEnabledStatus(cd);
                                    activeCustomDataMap.set(name, enabled);
                                    console.log(`Found CustomDataConfig in group.CustomAttributes: ${name} = ${enabled ? 'enabled' : 'disabled'}`);
                                }
                            });
                        }
                    }
                }

                // 5. Check AdvancedConfiguration or similar nested structures
                if (group.AdvancedConfiguration) {
                    try {
                        const advConfig = typeof group.AdvancedConfiguration === 'string' ?
                            JSON.parse(group.AdvancedConfiguration) : group.AdvancedConfiguration;
                        if (advConfig.CustomData && Array.isArray(advConfig.CustomData)) {
                            advConfig.CustomData.forEach(cd => {
                                const name = (cd.name || cd.Name || '').toLowerCase();
                                if (name) {
                                    const enabled = extractEnabledStatus(cd);
                                    activeCustomDataMap.set(name, enabled);
                                    console.log(`Found AdvancedConfiguration.CustomData: ${name} = ${enabled ? 'enabled' : 'disabled'}`);
                                }
                            });
                        }
                    } catch (e) {
                        console.warn('Failed to parse AdvancedConfiguration:', e);
                    }
                }

                // 6. Check for other possible field names that might contain enabled CustomData
                const possibleFields = [
                    'CustomDataConfiguration',
                    'CustomDataSettings',
                    'EnabledCustomDataDefinitions',
                    'CustomDataDefinitions',
                    'CustomDataList',
                    'ActiveCustomData'
                ];

                possibleFields.forEach(fieldName => {
                    if (group[fieldName]) {
                        console.log(`Found field ${fieldName}:`, group[fieldName]);
                        try {
                            let fieldValue = group[fieldName];
                            if (typeof fieldValue === 'string') {
                                fieldValue = JSON.parse(fieldValue);
                            }
                            if (Array.isArray(fieldValue)) {
                                fieldValue.forEach(cd => {
                                    const name = typeof cd === 'string' ? cd.toLowerCase() : (cd.name || cd.Name || '').toLowerCase();
                                    if (name) {
                                        const enabled = typeof cd === 'string' ? true : extractEnabledStatus(cd);
                                        activeCustomDataMap.set(name, enabled);
                                        console.log(`Found ${fieldName}: ${name} = ${enabled ? 'enabled' : 'disabled'}`);
                                    }
                                });
                            }
                        } catch (e) {
                            console.warn(`Failed to parse ${fieldName}:`, e);
                        }
                    }
                });

                groupCustomDataInfo = group.CustomData || group.customData || null;
            }
        } catch (err) {
            console.warn('Failed to fetch group CustomData info:', err);
        }

        // Try fetching CustomData configuration directly from group endpoint
        try {
            const groupCustomData = await sotiApiRequest(state.serverUrl, state.token, `/MobiControl/api/devicegroups/${encodedPath}/customdata`);
            console.log('Group CustomData from endpoint:', groupCustomData);

            // If it's an array, map each entry
            if (Array.isArray(groupCustomData)) {
                groupCustomData.forEach(cd => {
                    const name = (cd.name || cd.Name || '').toLowerCase();
                    if (name) {
                        const enabled = extractEnabledStatus(cd);
                        activeCustomDataMap.set(name, enabled);
                        console.log(`Found endpoint CustomData: ${name} = ${enabled ? 'enabled' : 'disabled'}`);
                    }
                });
            } else if (groupCustomData && typeof groupCustomData === 'object') {
                // If it's an object, check for items array or iterate properties
                const items = groupCustomData.items || groupCustomData.CustomData || Object.values(groupCustomData);
                if (Array.isArray(items)) {
                    items.forEach(cd => {
                        const name = (cd.name || cd.Name || '').toLowerCase();
                        if (name) {
                            const enabled = extractEnabledStatus(cd);
                            activeCustomDataMap.set(name, enabled);
                            console.log(`Found endpoint CustomData item: ${name} = ${enabled ? 'enabled' : 'disabled'}`);
                        }
                    });
                }
            }
        } catch (err) {
            // This endpoint might not exist, that's okay
            console.log('CustomData endpoint not available or failed:', err.message);
        }

        // CRITICAL: Also check customAttributes for CustomDataConfig
        // The CustomDataConfig is stored as a custom attribute containing JSON
        try {
            const customAttributes = await sotiApiRequest(state.serverUrl, state.token, `/MobiControl/api/devicegroups/${encodedPath}/customAttributes`);
            console.log('Group CustomAttributes:', customAttributes);

            // Find CustomDataConfig attribute
                let customDataConfigAttr = null;
                if (Array.isArray(customAttributes)) {
                    customDataConfigAttr = customAttributes.find(attr =>
                        (attr.name || attr.Name || '').toLowerCase() === 'customdataconfig'
                    );
                } else if (customAttributes && typeof customAttributes === 'object') {
                    // Check if it's an object with CustomDataConfig property
                    customDataConfigAttr = customAttributes.CustomDataConfig || customAttributes.customDataConfig;
                }

                if (customDataConfigAttr) {
                    console.log('Found CustomDataConfig attribute:', customDataConfigAttr);
                    console.log('CustomDataConfig attribute keys:', Object.keys(customDataConfigAttr));

                    // Extract the value - the actual config is in the .value property
                    // The attribute object itself has metadata like $type, name, etc.
                    let configValue = customDataConfigAttr.value || customDataConfigAttr.Value ||
                        customDataConfigAttr.CustomAttributeValue ||
                        customDataConfigAttr.StringValue;

                    // If value is not found, the attribute object itself might be the config (unlikely but possible)
                    if (configValue === undefined || configValue === null) {
                        console.warn('No value property found in CustomDataConfig attribute, using attribute object itself');
                        configValue = customDataConfigAttr;
                    }

                    console.log('CustomDataConfig raw value type:', typeof configValue);
                    console.log('CustomDataConfig raw value:', configValue);

                    // If it's a string, try to parse it as JSON
                    if (typeof configValue === 'string') {
                        try {
                            configValue = JSON.parse(configValue);
                            console.log('Parsed CustomDataConfig JSON:', configValue);
                        } catch (e) {
                            console.warn('Failed to parse CustomDataConfig JSON string:', e);
                            console.warn('Raw string value:', configValue);
                        }
                    }

                    // Process the config - it should be an array of CustomData definitions with enabled status
                    if (Array.isArray(configValue)) {
                        console.log(`Processing CustomDataConfig array with ${configValue.length} items`);
                        configValue.forEach((cd, index) => {
                            if (!cd) {
                                console.warn(`CustomDataConfig item at index ${index} is null/undefined`);
                                return;
                            }

                            // Handle both string (just name) and object formats
                            if (typeof cd === 'string') {
                                // If it's just a string, it's the name and it's enabled
                                const name = cd.toLowerCase();
                                activeCustomDataMap.set(name, true);
                                console.log(`Found CustomDataConfig string: ${name} = enabled`);
                            } else if (typeof cd === 'object') {
                                const name = (cd.name || cd.Name || cd.key || cd.Key || '').toLowerCase();
                                if (name) {
                                    const enabled = extractEnabledStatus(cd);
                                    activeCustomDataMap.set(name, enabled);
                                    console.log(`Found CustomDataConfig attribute: ${name} = ${enabled ? 'enabled' : 'disabled'}`, cd);
                                } else {
                                    console.warn(`CustomDataConfig item at index ${index} has no name:`, cd);
                                }
                            }
                        });
                    } else if (configValue && typeof configValue === 'object') {
                        console.log('CustomDataConfig is an object, checking structure...');
                        console.log('ConfigValue keys:', Object.keys(configValue));

                        // Skip metadata properties that are part of the attribute object, not the actual config
                        const metadataKeys = ['$type', 'name', 'originname', 'isinherited', 'value', 'datatype', 'Name', 'OriginName', 'IsInherited', 'Value', 'DataType'];
                        const actualKeys = Object.keys(configValue).filter(key => !metadataKeys.includes(key));

                        // Check if it's a map/dictionary where keys are CustomData names
                        // But only if it doesn't have metadata properties (which means it's the attribute object, not the config)
                        if (actualKeys.length > 0 && !metadataKeys.some(key => configValue.hasOwnProperty(key))) {
                            const firstValue = configValue[actualKeys[0]];

                            // If values are booleans or simple values, it's a name->enabled map
                            if (typeof firstValue === 'boolean' || typeof firstValue === 'string' || typeof firstValue === 'number') {
                                console.log('CustomDataConfig appears to be a name->enabled map');
                                actualKeys.forEach(key => {
                                    const name = key.toLowerCase();
                                    const value = configValue[key];
                                    // If value is boolean, use it directly; if truthy string/number, it's enabled
                                    const enabled = typeof value === 'boolean' ? value :
                                        (value === true || value === 'true' || value === 1 || value === '1' || value === 'enabled');
                                    activeCustomDataMap.set(name, enabled);
                                    console.log(`Found CustomDataConfig map entry: ${name} = ${enabled ? 'enabled' : 'disabled'}`);
                                });
                            }
                        } else {
                            // If it has metadata properties, the actual config is likely in the 'value' field as a string
                            if (metadataKeys.some(key => configValue.hasOwnProperty(key))) {
                                console.log('ConfigValue has metadata properties, extracting value field...');
                                const nestedValue = configValue.value || configValue.Value || configValue.CustomAttributeValue || configValue.StringValue;
                                console.log('Nested value type:', typeof nestedValue);
                                console.log('Nested value:', nestedValue);

                                if (nestedValue) {
                                    let parsedValue = nestedValue;

                                    // If it's a string, try to parse as JSON
                                    if (typeof nestedValue === 'string') {
                                        try {
                                            parsedValue = JSON.parse(nestedValue);
                                            console.log('Parsed nested value as JSON:', parsedValue);
                                        } catch (e) {
                                            console.warn('Failed to parse nested value as JSON, using as-is:', e);
                                        }
                                    }

                                    // Process the parsed value
                                    if (Array.isArray(parsedValue)) {
                                        console.log(`Processing parsed array with ${parsedValue.length} items`);
                                        parsedValue.forEach((cd, index) => {
                                            if (!cd) {
                                                console.warn(`Item at index ${index} is null/undefined`);
                                                return;
                                            }
                                            if (typeof cd === 'string') {
                                                const name = cd.toLowerCase();
                                                activeCustomDataMap.set(name, true);
                                                console.log(`Found CustomDataConfig string: ${name} = enabled`);
                                            } else if (typeof cd === 'object') {
                                                const name = (cd.name || cd.Name || cd.key || cd.Key || '').toLowerCase();
                                                if (name) {
                                                    const enabled = extractEnabledStatus(cd);
                                                    activeCustomDataMap.set(name, enabled);
                                                    console.log(`Found CustomDataConfig item: ${name} = ${enabled ? 'enabled' : 'disabled'}`, cd);
                                                } else {
                                                    console.warn(`Item at index ${index} has no name:`, cd);
                                                }
                                            }
                                        });
                                    } else if (parsedValue && typeof parsedValue === 'object') {
                                        console.log('Parsed value is an object, checking structure...');
                                        const parsedKeys = Object.keys(parsedValue);
                                        console.log('Parsed value keys:', parsedKeys);

                                        // Check if it's an array-like object or a map
                                        if (parsedKeys.length > 0) {
                                            const firstKey = parsedKeys[0];
                                            const firstVal = parsedValue[firstKey];

                                            // If it looks like a map (keys are CustomData names)
                                            if (typeof firstVal === 'boolean' || typeof firstVal === 'string' || typeof firstVal === 'number') {
                                                parsedKeys.forEach(key => {
                                                    const name = key.toLowerCase();
                                                    const val = parsedValue[key];
                                                    const enabled = typeof val === 'boolean' ? val :
                                                        (val === true || val === 'true' || val === 1 || val === '1' || val === 'enabled');
                                                    activeCustomDataMap.set(name, enabled);
                                                    console.log(`Found CustomDataConfig map: ${name} = ${enabled ? 'enabled' : 'disabled'}`);
                                                });
                                            } else if (Array.isArray(firstVal)) {
                                                // If first value is an array, it might be items array
                                                parsedValue.items?.forEach((cd, index) => {
                                                    if (!cd) return;
                                                    const name = (cd.name || cd.Name || '').toLowerCase();
                                                    if (name) {
                                                        activeCustomDataMap.set(name, extractEnabledStatus(cd));
                                                    }
                                                });
                                            }
                                        }
                                    }
                                } else {
                                    console.warn('No nested value found in CustomDataConfig attribute');
                                }
                            } else {
                                // If it's an object without metadata properties, check for items array or iterate properties
                                const items = configValue.items || configValue.CustomData || configValue.customData ||
                                    (Array.isArray(configValue) ? configValue : Object.values(configValue).filter(v => v && typeof v === 'object'));
                                if (Array.isArray(items)) {
                                    console.log(`Processing CustomDataConfig object items array with ${items.length} items`);
                                    items.forEach((cd, index) => {
                                        if (!cd) {
                                            console.warn(`CustomDataConfig item at index ${index} is null/undefined`);
                                            return;
                                        }
                                        // Handle both object format and string format
                                        if (typeof cd === 'string') {
                                            // If it's just a string (name), it's enabled
                                            const name = cd.toLowerCase();
                                            activeCustomDataMap.set(name, true);
                                            console.log(`Found CustomDataConfig string item: ${name} = enabled`);
                                        } else {
                                            const name = (cd.name || cd.Name || cd.key || cd.Key || '').toLowerCase();
                                            if (name) {
                                                const enabled = extractEnabledStatus(cd);
                                                activeCustomDataMap.set(name, enabled);
                                                console.log(`Found CustomDataConfig item: ${name} = ${enabled ? 'enabled' : 'disabled'}`, cd);
                                            } else {
                                                console.warn(`CustomDataConfig item at index ${index} has no name:`, cd);
                                            }
                                        }
                                    });
                                } else {
                                    console.warn('CustomDataConfig object does not contain an array of items:', configValue);
                                }
                            }
                        }
                    } else {
                        console.warn('CustomDataConfig value is not an array or object:', configValue);
                    }
                } else {
                    console.log('CustomDataConfig attribute not found in customAttributes');
                }
        } catch (err) {
            console.warn('Failed to fetch custom attributes:', err);
        }

        console.log('Final activeCustomDataMap:', Array.from(activeCustomDataMap.entries()));

        // Fetch Custom Attributes for the group
        let customAttributes = [];
        try {
            const groupCustomData = await getGroupCustomData(state.serverUrl, state.token, groupPath);
            customAttributes = groupCustomData.attributes || [];
            console.log('Fetched custom attributes:', customAttributes);
        } catch (err) {
            console.warn('Failed to fetch custom attributes:', err);
        }

        // Render CustomData table
        let count = 0;
        const tableBody = document.getElementById('group-info-body');
        if (tableBody) {
            tableBody.innerHTML = ''; // Clear previous

            if (customDataDefinitions && customDataDefinitions.length > 0) {
                customDataDefinitions.forEach(def => {
                    const tr = document.createElement('tr');
                    const name = def.name || def.Name || 'Unknown';

                    // Display the property name
                    tr.innerHTML = `
                        <td>${escapeHtml(name)}</td>
                    `;
                    tableBody.appendChild(tr);
                    count++;
                });
            } else {
                tableBody.innerHTML = '<tr><td colspan="1" class="placeholder-cell">No CustomData definitions found in the system.</td></tr>';
            }
        }

        // Update the CustomData count display
        const customDataCountBadge = document.getElementById('customdata-count');
        if (customDataCountBadge) {
            customDataCountBadge.textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
        }

        if (count > 0) {
            showToast(`Loaded ${count} CustomData definitions`, 'success');
            updateStatusBar(`Loaded ${count} CustomData definitions`, 'success');
        } else {
            updateStatusBar('No CustomData definitions found', 'info');
        }

        // Render Custom Attributes table (editable)
        const attributesTableBody = document.getElementById('group-attributes-body');
        if (attributesTableBody) {
            attributesTableBody.innerHTML = ''; // Clear previous

            // Filter out CustomDataConfig from attributes as it's not a user-facing attribute
            const displayAttributes = customAttributes.filter(attr => {
                const name = (attr.Name || attr.name || '').toLowerCase();
                return name !== 'customdataconfig';
            });

            if (displayAttributes && displayAttributes.length > 0) {
                displayAttributes.forEach(attr => {
                    const tr = document.createElement('tr');
                    const name = attr.Name || attr.name || 'Unknown';
                    // Get the value - it should already be properly mapped from getAttrValue
                    const value = attr.Value !== undefined ? attr.Value : '';
                    const displayValue = value !== null && value !== undefined ? String(value) : '';
                    const isInherited = attr.IsInherited || attr.isInherited || false;
                    
                    console.log(`[Render] Attribute: ${name}, Value: "${displayValue}", Inherited: ${isInherited}`);

                    // Create editable row with input and save button
                    tr.innerHTML = `
                        <td>
                            ${escapeHtml(name)}
                            ${isInherited ? '<span style="font-size: 10px; color: var(--text-secondary); margin-left: 4px;" title="Inherited from parent group">(inherited)</span>' : ''}
                        </td>
                        <td>
                            <input type="text" 
                                class="attr-value-input" 
                                data-attr-name="${escapeHtml(name)}" 
                                data-original-value="${escapeHtml(displayValue)}"
                                value="${escapeHtml(displayValue)}"
                                style="width: 100%; padding: 6px 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-primary);"
                                placeholder="Enter value..."
                            >
                        </td>
                        <td style="text-align: center;">
                            <button 
                                class="btn btn-primary btn-small save-attr-btn" 
                                data-attr-name="${escapeHtml(name)}"
                                style="padding: 4px 10px; font-size: 12px;"
                                disabled
                            >Save</button>
                        </td>
                    `;
                    attributesTableBody.appendChild(tr);
                });

                // Add event listeners for inputs and save buttons
                attributesTableBody.querySelectorAll('.attr-value-input').forEach(input => {
                    input.addEventListener('input', (e) => {
                        const originalValue = e.target.dataset.originalValue || '';
                        const currentValue = e.target.value;
                        const saveBtn = e.target.closest('tr').querySelector('.save-attr-btn');
                        
                        // Enable/disable save button based on whether value changed
                        if (currentValue !== originalValue) {
                            saveBtn.disabled = false;
                            saveBtn.classList.add('btn-changed');
                        } else {
                            saveBtn.disabled = true;
                            saveBtn.classList.remove('btn-changed');
                        }
                    });

                    // Allow Enter key to save
                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            const saveBtn = e.target.closest('tr').querySelector('.save-attr-btn');
                            if (!saveBtn.disabled) {
                                saveBtn.click();
                            }
                        }
                    });
                });

                attributesTableBody.querySelectorAll('.save-attr-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const attrName = e.target.dataset.attrName;
                        const input = e.target.closest('tr').querySelector('.attr-value-input');
                        const newValue = input.value;

                        await updateCustomAttributeValue(groupPath, attrName, newValue, e.target, input);
                    });
                });
            } else {
                attributesTableBody.innerHTML = '<tr><td colspan="3" class="placeholder-cell">No Custom Attributes found for this group.</td></tr>';
            }
        }

    } catch (error) {
        console.error('Group data fetch error:', error);
        updateStatusBar('Failed to fetch group data', 'error');
    } finally {
        setTimeout(() => hideStatusBar(), 3000);
    }
}

// ==================== Predefined Data Picker ====================
const PREDEFINED_INI_FILE = '/sdcard/Download/customdata.ini';

// Helper function to add spaces before capital letters
// Example: "DefaultLauncher" -> "Default Launcher"
// Example: "DistanceToAP" -> "Distance To A P"
function formatKeyForDisplay(key) {
    return key.replace(/([a-z])([A-Z])/g, '$1 $2');
}

const PREDEFINED_DATA = {
    APPS: ['DefaultLauncher', 'PlayServicesVersion', 'WebViewVersion'],
    BATTERY: ['BatteryCurrent', 'BatteryCycleCount', 'BatteryHealth', 'BatteryPlugType', 'BatteryStatus', 'BatteryTemperature', 'BatteryVoltage'],
    BLUETOOTH: ['BluetoothConnectedDevices', 'BluetoothMacAddress', 'BluetoothPairedDevices', 'BluetoothScanMode', 'BluetoothState'],
    CELLULAR: ['CellBand', 'CellCarrier', 'CellLAC', 'CellMCC', 'CellMNC', 'CellNetType', 'CellRSRP', 'CellRSRQ', 'CellRadio', 'CellSINR', 'CellSignal', 'CellTower', 'CellTowerId'],
    DEVICE: ['CpuArchitecture', 'DistanceToAP', 'DropEventsToday', 'LastUpdated', 'LowMemoryThreshold', 'NTPServer', 'NfcStatus', 'ProcessorCount', 'USBAccessories', 'USBConnected', 'WakeGestureEnabled'],
    DISPLAY: ['AutoRotate', 'FontScale', 'RefreshRate', 'ScreenBrightness', 'ScreenDensity', 'ScreenLockStatus', 'ScreenResolution', 'ScreenTimeout', 'UserRotation'],
    GPS: ['GpsStatus', 'LocationMode', 'MockLocation'],
    NETWORK: ['APN', 'BSSID', 'DNS', 'GatewayIPv4', 'GatewayIPv6', 'HiddenSSID', 'LinkSpeed', 'LocalIP', 'MacRandomization', 'NetworkConnectionType', 'NetworkSignalStrength', 'PreferredNetworkMode', 'PrivateDnsMode', 'PublicIP', 'RoamingStatus', 'SavedSSIDs', 'SubnetMask', 'TetheringBluetooth', 'TetheringEthernet', 'TetheringHotspot', 'TetheringUSB', 'VPNActive', 'VpnServerAddress', 'WifiBand', 'WifiChannel', 'WifiFrequency', 'WifiMaxDhcpRetryCount', 'WifiRssi', 'WifiRxLinkSpeed', 'WifiSSID', 'WifiStandard', 'WifiStatus', 'WifiTxLinkSpeed'],
    OS: ['ActiveKeyboard', 'AutoTimeEnabled', 'AutoTimeZone', 'BuildFingerprint', 'CurrentTimeZone', 'EnabledKeyboards', 'LastRebootReason', 'LastRebootTime', 'LocaleList', 'SystemUptime', 'TimeFormat'],
    PING_CONNECTIONS: ['PingTarget1', 'PingTarget2', 'PingTarget3'],
    RAM: ['RamTotal', 'RamUsageProcent', 'RamUseage'],
    SECURITY: ['BootloaderStatus', 'DeveloperOptions', 'PlayIntegrityStatus', 'SecureElement', 'UnknownSources', 'UsbDebugging'],
    SENSORS: ['CpuTemperature', 'InternalTemperature', 'ThermalStatus'],
    STORAGE: ['EncryptionType', 'StorageHealth', 'StorageTotal', 'StorageUse', 'StorageUseProcent'],
    VOLUME: ['MicMuted', 'RingerMode', 'VolumeAccessibility', 'VolumeAlarm', 'VolumeMusic', 'VolumeNotification', 'VolumeRing', 'VolumeVoiceCall']
};

// Track selected predefined items
const selectedPredefinedItems = new Set();
const collapsedSections = new Set();

function renderPredefinedPicker(searchQuery = '') {
    const container = elements.predefinedPickerContent;
    if (!container) return;

    const lowerQuery = searchQuery.toLowerCase();
    let hasResults = false;

    let html = '';
    for (const [section, keys] of Object.entries(PREDEFINED_DATA)) {
        const filteredKeys = keys.filter(key => 
            lowerQuery === '' || 
            key.toLowerCase().includes(lowerQuery) || 
            section.toLowerCase().includes(lowerQuery)
        );

        if (filteredKeys.length === 0) continue;
        hasResults = true;

        const isCollapsed = collapsedSections.has(section);
        const selectedInSection = filteredKeys.filter(k => selectedPredefinedItems.has(`${section}:${k}`)).length;
        const allSelected = selectedInSection === filteredKeys.length;
        const someSelected = selectedInSection > 0 && !allSelected;

        html += `
            <div class="picker-section ${isCollapsed ? 'collapsed' : ''}" data-section="${section}">
                <div class="picker-section-header">
                    <div class="picker-section-left">
                        <svg class="picker-section-chevron" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                        <div class="picker-section-checkbox ${allSelected ? 'checked' : ''} ${someSelected ? 'partial' : ''}" data-section="${section}">
                            ${allSelected ? '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>' : ''}
                            ${someSelected ? '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14" /></svg>' : ''}
                        </div>
                        <span class="picker-section-name">${formatKeyForDisplay(section)}</span>
                    </div>
                    <span class="picker-section-count">${selectedInSection}/${filteredKeys.length}</span>
                </div>
                <div class="picker-section-content">
                    ${filteredKeys.map(key => {
                        const itemId = `${section}:${key}`;
                        const isSelected = selectedPredefinedItems.has(itemId);
                        return `
                            <div class="picker-item ${isSelected ? 'selected' : ''}" data-item="${itemId}">
                                <div class="picker-item-checkbox">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                    </svg>
                                </div>
                                <span class="picker-item-name">${formatKeyForDisplay(key)}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    if (!hasResults) {
        html = `
            <div class="picker-no-results">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <p>No data points match "${escapeHtml(searchQuery)}"</p>
            </div>
        `;
    }

    container.innerHTML = html;
    updatePredefinedSelectedCount();
    bindPredefinedPickerEvents();
}

function bindPredefinedPickerEvents() {
    // Section header click (toggle collapse)
    document.querySelectorAll('.picker-section-header').forEach(header => {
        header.addEventListener('click', (e) => {
            // Don't toggle if clicking checkbox
            if (e.target.closest('.picker-section-checkbox')) return;
            
            const section = header.closest('.picker-section');
            const sectionName = section.dataset.section;
            
            if (collapsedSections.has(sectionName)) {
                collapsedSections.delete(sectionName);
            } else {
                collapsedSections.add(sectionName);
            }
            section.classList.toggle('collapsed');
        });
    });

    // Section checkbox click (select/deselect all in section)
    document.querySelectorAll('.picker-section-checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            const sectionName = checkbox.dataset.section;
            const keys = PREDEFINED_DATA[sectionName] || [];
            const allSelected = keys.every(k => selectedPredefinedItems.has(`${sectionName}:${k}`));

            if (allSelected) {
                // Deselect all
                keys.forEach(k => selectedPredefinedItems.delete(`${sectionName}:${k}`));
            } else {
                // Select all
                keys.forEach(k => selectedPredefinedItems.add(`${sectionName}:${k}`));
            }
            renderPredefinedPicker(elements.predefinedSearch?.value || '');
        });
    });

    // Individual item click
    document.querySelectorAll('.picker-item').forEach(item => {
        item.addEventListener('click', () => {
            const itemId = item.dataset.item;
            if (selectedPredefinedItems.has(itemId)) {
                selectedPredefinedItems.delete(itemId);
            } else {
                selectedPredefinedItems.add(itemId);
            }
            renderPredefinedPicker(elements.predefinedSearch?.value || '');
        });
    });
}

function updatePredefinedSelectedCount() {
    const count = selectedPredefinedItems.size;
    if (elements.predefinedSelectedCount) {
        elements.predefinedSelectedCount.textContent = `${count} selected`;
    }
    if (elements.addSelectedPredefinedBtn) {
        elements.addSelectedPredefinedBtn.disabled = count === 0;
    }
}

// Search handler
elements.predefinedSearch?.addEventListener('input', (e) => {
    renderPredefinedPicker(e.target.value);
});

// Expand/Collapse all
elements.expandAllBtn?.addEventListener('click', () => {
    collapsedSections.clear();
    renderPredefinedPicker(elements.predefinedSearch?.value || '');
});

elements.collapseAllBtn?.addEventListener('click', () => {
    Object.keys(PREDEFINED_DATA).forEach(section => collapsedSections.add(section));
    renderPredefinedPicker(elements.predefinedSearch?.value || '');
});

// Select All / None
document.getElementById('select-all-predefined-btn')?.addEventListener('click', () => {
    // Select all items across all sections
    for (const [section, keys] of Object.entries(PREDEFINED_DATA)) {
        keys.forEach(key => selectedPredefinedItems.add(`${section}:${key}`));
    }
    renderPredefinedPicker(elements.predefinedSearch?.value || '');
});

document.getElementById('select-none-predefined-btn')?.addEventListener('click', () => {
    // Deselect all items
    selectedPredefinedItems.clear();
    renderPredefinedPicker(elements.predefinedSearch?.value || '');
});

// Add selected items to the list
elements.addSelectedPredefinedBtn?.addEventListener('click', () => {
    if (selectedPredefinedItems.size === 0) {
        showToast('Please select at least one data point', 'error');
        return;
    }

    let addedCount = 0;
    selectedPredefinedItems.forEach(itemId => {
        const [section, key] = itemId.split(':');
        const displayName = formatKeyForDisplay(key);
        const formattedSection = formatKeyForDisplay(section);
        const itemValue = {
            type: 'ini',
            file: PREDEFINED_INI_FILE,
            section: section,
            valName: key,
            dataType: 'STRING',
            description: `${formattedSection} - ${displayName}`,
            _originalKey: key  // Store original key for technical reference
        };
        // Use formatted displayName as the name (for SOTI API Name field)
        addDataItem(displayName, itemValue, true);
        addedCount++;
    });

    showToast(`Added ${addedCount} data point${addedCount > 1 ? 's' : ''} to the list`, 'success');
    
    // Clear selection
    selectedPredefinedItems.clear();
    renderPredefinedPicker(elements.predefinedSearch?.value || '');
    
    // Switch to the List tab to show the added items
    document.querySelector('.tab[data-tab="list"]')?.click();
});

// ==================== XSight Agent Data Picker ====================
const XSIGHT_INI_FILE = '/sdcard/Download/XSightReport_AllJson.ini';
const XSIGHT_DATA_POINTS = [
    { key: 'mcAgentVersion', displayName: 'MC Agent Version' },
    { key: 'osVersion', displayName: 'OS Version' },
    { key: 'activeCollectors', displayName: 'XSight Active Collectors' },
    { key: 'activeCookers', displayName: 'XSight Active Cookers' },
    { key: 'activeLiveview', displayName: 'XSight Active Liveview' },
    { key: 'agentVersion', displayName: 'XSight Agent Version' },
    { key: 'batteryCapacity', displayName: 'XSight Battery Capacity' },
    { key: 'configuration.collectPeriod', displayName: 'XSight Configuration Collect Period' },
    { key: 'configuration.configurations', displayName: 'XSight Configuration Configurations' },
    { key: 'configuration.cookFrom', displayName: 'XSight Configuration Cook From' },
    { key: 'configuration.cookPeriod', displayName: 'XSight Configuration Cook Period' },
    { key: 'configuration.delivery', displayName: 'XSight Configuration Delivery' },
    { key: 'configuration.deliveryWindowLength', displayName: 'XSight Configuration Delivery Window Length' },
    { key: 'configuration.lastCollection', displayName: 'XSight Configuration Last Collection' },
    { key: 'configuration.nextCollection', displayName: 'XSight Configuration Next Collection' },
    { key: 'configuration.oldAppPreferences', displayName: 'XSight Configuration Old App Preferences' },
    { key: 'configuration.profileName', displayName: 'XSight Configuration Profile Name' },
    { key: 'connection', displayName: 'XSight Connection' },
    { key: 'lastCookStatus', displayName: 'XSight Cook Status' },
    { key: 'databaseSize', displayName: 'XSight Database Size' },
    { key: 'deviceId', displayName: 'XSight Device ID' },
    { key: 'keepRawData', displayName: 'XSight Keep Raw Data' },
    { key: 'lastUpload', displayName: 'XSight Last Upload' },
    { key: 'liveSupport.authState', displayName: 'XSight Live Support Auth State' },
    { key: 'liveSupport.installState', displayName: 'XSight Live Support Install State' },
    { key: 'liveSupport.networkState', displayName: 'XSight Live Support Network State' },
    { key: 'liveSupport.serviceBoundState', displayName: 'XSight Live Support Service Bound State' },
    { key: 'liveSupport.trustState', displayName: 'XSight Live Support Trust State' },
    { key: 'liveSupport.webSocketState', displayName: 'XSight Live Support Web Socket State' },
    { key: 'nextUpload', displayName: 'XSight Next Upload' },
    { key: 'serverAddress', displayName: 'XSight Server Address' },
    { key: 'smartSocketStatus', displayName: 'XSight Smart Socket Status' },
    { key: 'smartSocketVersion', displayName: 'XSight Smart Socket Version' }
];

const selectedXsightItems = new Set();

function updateXsightSelectedCount() {
    const count = selectedXsightItems.size;
    if (elements.xsightSelectedCount) {
        elements.xsightSelectedCount.textContent = `${count} selected`;
    }
    if (elements.addXsightSelectedBtn) {
        elements.addXsightSelectedBtn.disabled = count === 0;
    }
}

function renderXsightPicker(filterText = '') {
    const container = elements.xsightItemsList;
    if (!container) return;

    const filter = filterText.toLowerCase().trim();
    
    // Filter items (search both key and displayName)
    const filteredItems = XSIGHT_DATA_POINTS.filter(item => 
        !filter || item.key.toLowerCase().includes(filter) || item.displayName.toLowerCase().includes(filter)
    );

    if (filteredItems.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">No matching data points found</div>';
        return;
    }

    container.innerHTML = filteredItems.map(item => {
        const isSelected = selectedXsightItems.has(item.key);
        return `
            <label class="picker-item ${isSelected ? 'selected' : ''}">
                <input type="checkbox" data-key="${item.key}" ${isSelected ? 'checked' : ''} />
                <span>${item.displayName}</span>
            </label>
        `;
    }).join('');

    // Add event listeners to checkboxes
    container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const key = e.target.dataset.key;
            if (e.target.checked) {
                selectedXsightItems.add(key);
            } else {
                selectedXsightItems.delete(key);
            }
            // Update visual state
            e.target.closest('.picker-item').classList.toggle('selected', e.target.checked);
            updateXsightSelectedCount();
        });
    });
}

// Initialize XSight picker
document.addEventListener('DOMContentLoaded', () => {
    renderXsightPicker();
    updateXsightSelectedCount();
});

// XSight Search
elements.xsightSearch?.addEventListener('input', (e) => {
    renderXsightPicker(e.target.value);
});

// XSight Select All
elements.xsightSelectAllBtn?.addEventListener('click', () => {
    const filter = elements.xsightSearch?.value?.toLowerCase().trim() || '';
    XSIGHT_DATA_POINTS.forEach(item => {
        if (!filter || item.key.toLowerCase().includes(filter) || item.displayName.toLowerCase().includes(filter)) {
            selectedXsightItems.add(item.key);
        }
    });
    renderXsightPicker(elements.xsightSearch?.value || '');
    updateXsightSelectedCount();
});

// XSight Select None
elements.xsightSelectNoneBtn?.addEventListener('click', () => {
    selectedXsightItems.clear();
    renderXsightPicker(elements.xsightSearch?.value || '');
    updateXsightSelectedCount();
});

// Add selected XSight items to the list
elements.addXsightSelectedBtn?.addEventListener('click', () => {
    if (selectedXsightItems.size === 0) {
        showToast('Please select at least one data point', 'error');
        return;
    }

    let addedCount = 0;
    selectedXsightItems.forEach(key => {
        // Find the item to get its displayName
        const item = XSIGHT_DATA_POINTS.find(i => i.key === key);
        const displayName = item ? item.displayName : key;
        
        // Parse the key to get section and valName
        // Keys with dots like "configuration.collectPeriod" -> section="configuration", valName="collectPeriod"
        // Keys without dots like "serverAddress" -> section="Status", valName="serverAddress"
        let section = 'Status';  // Default section for keys without dots
        let valName = key;
        
        if (key.includes('.')) {
            const parts = key.split('.');
            section = parts[0];
            valName = parts.slice(1).join('.');
        }
        
        const itemValue = {
            type: 'ini',
            file: XSIGHT_INI_FILE,
            section: section,
            valName: valName,
            dataType: 'STRING',
            description: `XSight Agent - ${displayName}`
        };
        // Use displayName as the name (for SOTI API Name field), but keep key for technical reference
        // Store the original key in the value object for reference if needed
        itemValue._originalKey = key;
        addDataItem(displayName, itemValue, true);
        addedCount++;
    });

    showToast(`Added ${addedCount} XSight data point${addedCount > 1 ? 's' : ''} to the list`, 'success');
    
    // Clear selection
    selectedXsightItems.clear();
    renderXsightPicker(elements.xsightSearch?.value || '');
    updateXsightSelectedCount();
    
    // Switch to the List tab to show the added items
    document.querySelector('.tab[data-tab="list"]')?.click();
});

// ==================== Data Grid ====================
function updateStagedCount() {
    const count = state.dataItems.length;

    // Update inline count
    const el = document.getElementById('staged-count');
    if (el) {
        el.textContent = `(${count})`;
    }

    // Update tab badge
    const tabBadge = document.getElementById('staged-count-tab');
    if (tabBadge) {
        tabBadge.textContent = `(${count})`;
    }
}

function addDataItem(key, value, isManuallyAdded = false) {
    // Check for duplicates
    const existing = state.dataItems.findIndex(d => d.key === key);
    if (existing !== -1) {
        state.dataItems[existing].value = value;
        // Preserve manually added flag if it was already set
        if (isManuallyAdded || state.dataItems[existing]._manuallyAdded) {
            state.dataItems[existing]._manuallyAdded = true;
        }
    } else {
        state.dataItems.push({ key, value, _manuallyAdded: isManuallyAdded });
    }

    renderDataGrid();
    updateApplyButton();

    // Scroll to new item
    if (elements.dataTableBody) {
        setTimeout(() => elements.dataTableBody.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    }
}

function removeDataItem(key) {
    state.dataItems = state.dataItems.filter(d => d.key !== key);
    renderDataGrid();
    updateApplyButton();
}

function renderDataGrid() {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4f88e0f6-1cd1-4fef-a99c-f90eaf9c8934', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'renderer.js:1848', message: 'renderDataGrid entry', data: { itemCount: state.dataItems.length, items: state.dataItems.map(i => ({ key: i.key, valueType: typeof i.value, hasType: !!i.value?.type })) }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
    // #endregion
    updateStagedCount();

    if (state.dataItems.length === 0) {
        elements.dataTableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="4" class="empty-message">No data added yet</td>
            </tr>
        `;
        return;
    }

    // #region agent log
    state.dataItems.forEach((item, idx) => {
        fetch('http://127.0.0.1:7242/ingest/4f88e0f6-1cd1-4fef-a99c-f90eaf9c8934', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'renderer.js:1860', message: 'item value check before render', data: { index: idx, key: item.key, valueType: typeof item.value, valueIsObject: typeof item.value === 'object', hasType: !!item.value?.type, typeValue: item.value?.type }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
    });
    // #endregion

    elements.dataTableBody.innerHTML = state.dataItems.map(item => {
        // Safety check for item structure
        if (!item.value || typeof item.value !== 'object' || !item.value.type) {
            console.error('Invalid item structure in renderDataGrid:', item);
            return `
                <tr style="background-color: var(--error-bg, #fee);">
                    <td>${escapeHtml(formatKeyForDisplay(item.key || 'Unknown'))}</td>
                    <td><span class="badge error">ERROR</span></td>
                    <td>Invalid structure - please remove and re-add</td>
                    <td>
                        <button class="delete-row-btn" data-key="${escapeHtml(item.key || '')}" title="Remove">🗑️</button>
                    </td>
                </tr>
            `;
        }
        return `
            <tr>
                <td>${escapeHtml(item.value.description || formatKeyForDisplay(item.key))}</td>
                <td><span class="badge ${item.value.type}">${item.value.type.toUpperCase()}</span></td>
                <td>${formatValueDetails(item.value)}</td>
                <td>
                    <button class="delete-row-btn" data-key="${escapeHtml(item.key)}" title="Remove">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');

    // Add delete handlers
    elements.dataTableBody.querySelectorAll('.delete-row-btn').forEach(btn => {
        btn.addEventListener('click', () => removeDataItem(btn.dataset.key));
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatValueDetails(val) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/4f88e0f6-1cd1-4fef-a99c-f90eaf9c8934', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'renderer.js:1883', message: 'formatValueDetails entry', data: { valType: typeof val, hasType: !!val?.type, typeValue: val?.type }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => { });
    // #endregion
    if (val.type === 'ini') return `File: <b>${escapeHtml(val.file)}</b> | [${escapeHtml(val.section)}] ${escapeHtml(val.valName)}`;
    if (val.type === 'xml') return `File: <b>${escapeHtml(val.file)}</b> | XPath: ${escapeHtml(val.xpath)}`;
    if (val.type === 'static' || val.type === 'existing') return `<span class="badge static">STATIC</span> ${escapeHtml(val.value)}`;
    return JSON.stringify(val);
}

elements.clearAllBtn.addEventListener('click', () => {
    if (state.dataItems.length > 0 && confirm('Clear all data items?')) {
        state.dataItems = [];
        renderDataGrid();
        updateApplyButton();
        showToast('Cleared all data items', 'info');
    }
});

// ==================== Apply Data ====================
function updateApplyButton() {
    const canApply = state.dataItems.length > 0 &&
        state.selectedGroups.length > 0 &&
        state.isConnected;

    elements.applyBtn.disabled = !canApply;

    if (state.selectedGroups.length > 0) {
        elements.applyBtn.textContent = `Apply to ${state.selectedGroups.length} Group${state.selectedGroups.length === 1 ? '' : 's'}`;
    } else {
        elements.applyBtn.textContent = 'Apply to Selected Groups';
    }
}

elements.applyBtn.addEventListener('click', async () => {
    // Validate before starting
    if (!state.isConnected || !state.token || !state.serverUrl) {
        showToast('Not connected to server. Please connect first.', 'error');
        return;
    }

    if (state.dataItems.length === 0) {
        showToast('No data items to apply. Please add items first.', 'error');
        return;
    }

    if (state.selectedGroups.length === 0) {
        showToast('No groups selected. Please select at least one group.', 'error');
        return;
    }

    // Validate data items structure
    const invalidItems = state.dataItems.filter(item => {
        if (!item.key) return true;
        if (!item.value) return true;
        if (typeof item.value !== 'object') return true;
        if (!item.value.type) return true;
        // For static items, check if value.value exists
        if (item.value.type === 'static' && typeof item.value.value === 'undefined') return true;
        return false;
    });

    if (invalidItems.length > 0) {
        console.error('Invalid data items found:', invalidItems);
        showToast(`Error: ${invalidItems.length} item(s) have invalid structure. Please check console.`, 'error');
        return;
    }

    // Validate selected groups have paths
    const groupsWithoutPaths = state.selectedGroups.filter(g => !g.path || g.path.trim() === '');
    if (groupsWithoutPaths.length > 0) {
        console.error('Groups without paths:', groupsWithoutPaths);
        showToast(`Error: ${groupsWithoutPaths.length} group(s) missing path information. Please refresh groups.`, 'error');
        return;
    }

    // Live run
    try {
        const totalGroups = state.selectedGroups.length;
        let successCount = 0;
        let failCount = 0;
        const failedGroups = [];

        elements.applyBtn.disabled = true;
        elements.applyBtn.textContent = 'Applying...';

        console.log('Starting apply operation:', {
            totalGroups,
            dataItemsCount: state.dataItems.length,
            dataItems: state.dataItems.map(item => ({
                key: item.key,
                valueType: typeof item.value,
                hasType: !!item.value?.type,
                type: item.value?.type,
                hasValue: typeof item.value?.value !== 'undefined'
            })),
            selectedGroups: state.selectedGroups.map(g => ({ id: g.id, path: g.path }))
        });

        for (let i = 0; i < totalGroups; i++) {
            const group = state.selectedGroups[i];
            const groupName = group.path || group.name || `Group ${i + 1}`;

            if (!group.path || group.path.trim() === '') {
                console.error(`Group ${i + 1} missing path:`, group);
                failCount++;
                failedGroups.push({ name: groupName, error: 'Missing group path' });
                showToast(`Failed: ${groupName} - Missing group path`, 'error');
                continue;
            }

            updateStatusBar(`Applying to group ${i + 1}/${totalGroups}: ${groupName}`, 'info', true);

            try {
                const result = await applyCustomDataToGroup(state.serverUrl, state.token, group.id, state.dataItems, group.path);

                // Verify the data was actually saved (with a small delay to allow SOTI to process)
                console.log(`Waiting 1 second before verifying applied data for ${groupName}...`);
                await new Promise(resolve => setTimeout(resolve, 1000));

                try {
                    const verifyData = await getGroupCustomData(state.serverUrl, state.token, group.path);
                    const appliedAttributes = verifyData.attributes || [];

                    // Check if our applied attributes are present
                    const appliedKeys = state.dataItems
                        .filter(item => item.value && item.value.type === 'static')
                        .map(item => item.key);

                    const foundAttributes = appliedKeys.filter(key =>
                        appliedAttributes.some(attr => attr.name === key && attr.value !== null && attr.value !== undefined)
                    );

                    console.log(`Verification for ${groupName}:`, {
                        expected: appliedKeys,
                        found: foundAttributes,
                        allAttributes: appliedAttributes.map(a => ({ name: a.name, value: a.value }))
                    });

                    if (foundAttributes.length < appliedKeys.length) {
                        const missing = appliedKeys.filter(k => !foundAttributes.includes(k));
                        console.warn(`⚠️ Some attributes not found after applying to ${groupName}:`, missing);
                        console.warn(`⚠️ This may indicate the data was not saved. Check SOTI console manually.`);
                        // Don't fail, but log a warning
                    } else {
                        console.log(`✅ Verification successful: All ${foundAttributes.length} attributes found in ${groupName}`);
                    }
                } catch (verifyErr) {
                    console.warn(`Could not verify applied data for ${groupName}:`, verifyErr);
                    // Don't fail the operation, verification is optional
                }

                successCount++;
                console.log(`Successfully applied to ${groupName}:`, result);
            } catch (err) {
                console.error(`Failed to apply to ${groupName}:`, err);
                failCount++;
                failedGroups.push({ name: groupName, error: err.message });
                // Show error toast for this specific group
                showToast(`Failed: ${groupName} - ${err.message}`, 'error');
            }
        }

        // Final status update
        if (failCount === 0) {
            updateStatusBar(`Successfully applied ${state.dataItems.length} items to all ${successCount} groups`, 'success');
            showToast(`✅ Applied changes to ${successCount} group${successCount === 1 ? '' : 's'}!`, 'success');

            // Clear the data items list after successful apply
            state.dataItems = [];
            renderDataGrid();
            console.log('Cleared data items list after successful apply');
        } else {
            const errorSummary = failedGroups.map(fg => `${fg.name}: ${fg.error}`).join('; ');
            updateStatusBar(`Completed with errors. Success: ${successCount}, Failed: ${failCount}`, 'warning');
            showToast(`⚠️ Finished: ${successCount} succeeded, ${failCount} failed. Check console for details.`, 'warning');
            console.error('Failed groups:', failedGroups);
        }

        setTimeout(() => hideStatusBar(), 5000);

    } catch (error) {
        console.error('Critical apply error:', error);
        updateStatusBar('Critical error during apply operation', 'error');
        showToast(`System error: ${error.message}`, 'error');
        setTimeout(() => hideStatusBar(), 5000);
    } finally {
        updateApplyButton();
    }
});

// ==================== Sidebar Resizer ====================
function initSidebarResizer() {
    const sidebar = document.getElementById('sidebar');
    const resizer = document.getElementById('sidebar-resizer');

    if (!sidebar || !resizer) return;

    let isResizing = false;
    let startX = 0;
    let startWidth = 0;

    // Load saved width from localStorage
    const savedWidth = localStorage.getItem('sidebar-width');
    if (savedWidth) {
        const width = parseInt(savedWidth, 10);
        if (width >= 200 && width <= 600) {
            sidebar.style.width = `${width}px`;
        }
    }

    resizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        startX = e.clientX;
        startWidth = sidebar.offsetWidth;
        resizer.classList.add('resizing');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        const diff = e.clientX - startX;
        const newWidth = startWidth + diff;
        const minWidth = 200;
        const maxWidth = 600;

        if (newWidth >= minWidth && newWidth <= maxWidth) {
            sidebar.style.width = `${newWidth}px`;
        }
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            resizer.classList.remove('resizing');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';

            // Save width to localStorage
            localStorage.setItem('sidebar-width', sidebar.offsetWidth.toString());
        }
    });
}

// ==================== Settings Menu ====================
function countTotalDatapoints() {
    // Count predefined datapoints
    let predefinedCount = 0;
    for (const [section, keys] of Object.entries(PREDEFINED_DATA)) {
        predefinedCount += keys.length;
    }
    
    // Count XSight datapoints (hardcoded in HTML, count checkboxes)
    const xsightCheckboxes = document.querySelectorAll('#xsight-items-list input[type="checkbox"]');
    const xsightCount = xsightCheckboxes.length;
    
    return predefinedCount + xsightCount;
}

function updateDatapointCount() {
    const countElement = document.getElementById('datapoint-count');
    if (countElement) {
        const totalCount = countTotalDatapoints();
        countElement.textContent = totalCount;
    }
}

function initSettingsMenu() {
    const settingsMenu = document.querySelector('.settings-menu');
    const settingsToggle = document.getElementById('settings-menu-toggle');
    const settingsContent = document.getElementById('settings-menu-content');
    
    if (!settingsMenu || !settingsToggle) return;
    
    // Start with menu collapsed
    settingsMenu.classList.remove('expanded');
    
    // Toggle on click
    settingsToggle.addEventListener('click', () => {
        settingsMenu.classList.toggle('expanded');
    });
    
    // Update datapoint count
    updateDatapointCount();
}

// ==================== Initialize ====================
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize sidebar resizer
    initSidebarResizer();

    await loadProfiles();

    renderDataGrid();
    
    // Initialize predefined data picker
    renderPredefinedPicker();
    updateApplyButton();

    // Init Theme
    applyTheme(state.theme);
    
    // Initialize settings menu
    initSettingsMenu();
});

// Helper
function toPascalCase(str) {
    if (!str) return 'String';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
