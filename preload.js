const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to renderer process
contextBridge.exposeInMainWorld('api', {
    // Credentials
    credentials: {
        save: (profileName, credentials) => ipcRenderer.invoke('credentials:save', profileName, credentials),
        get: (profileName) => ipcRenderer.invoke('credentials:get', profileName),
        list: () => ipcRenderer.invoke('credentials:list'),
        delete: (profileName) => ipcRenderer.invoke('credentials:delete', profileName)
    },

    // File operations
    file: {
        openDialog: (filters) => ipcRenderer.invoke('dialog:openFile', filters),
        parse: (filePath) => ipcRenderer.invoke('file:parse', filePath)
    },

    // SOTI API calls (routed through main process to bypass CORS)
    soti: {
        getToken: (serverUrl, clientId, clientSecret, username, password) => 
            ipcRenderer.invoke('soti:getToken', serverUrl, clientId, clientSecret, username, password),
        getGroups: (serverUrl, token) => 
            ipcRenderer.invoke('soti:getGroups', serverUrl, token),
        getCustomAttributes: (serverUrl, token) => 
            ipcRenderer.invoke('soti:getCustomAttributes', serverUrl, token),
        getGroupCustomData: (serverUrl, token, groupPath) => 
            ipcRenderer.invoke('soti:getGroupCustomData', serverUrl, token, groupPath),
        createCustomAttribute: (serverUrl, token, attributeData) => 
            ipcRenderer.invoke('soti:createCustomAttribute', serverUrl, token, attributeData),
        setGroupCustomAttribute: (serverUrl, token, groupPath, attributeName, value) => 
            ipcRenderer.invoke('soti:setGroupCustomAttribute', serverUrl, token, groupPath, attributeName, value),
        request: (serverUrl, token, endpoint, method, body) => 
            ipcRenderer.invoke('soti:request', serverUrl, token, endpoint, method, body)
    }
});
