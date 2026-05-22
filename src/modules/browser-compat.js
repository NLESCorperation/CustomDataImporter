// Browser-compatible API mock (for Visual Browser testing)
// This provides a fallback when running outside Electron

// Proxy fetch calls to SOTI APIs through our server to avoid CORS issues
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
    if (typeof url === 'string' && url.includes('/MobiControl/api/')) {
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
        const proxyOptions = {
            ...options,
            headers: {
                ...options.headers,
                'X-Original-Method': options.method || 'GET'
            }
        };
        return originalFetch(proxyUrl, proxyOptions);
    }
    return originalFetch(url, options);
};

// Mock Electron API for browser compatibility
if (typeof window.api === 'undefined') {
    const mockGroups = [
        { ReferenceId: 'G1', Name: 'Demo Group', Path: '\\Demo Group' },
        { ReferenceId: 'G2', Name: 'Warehouse', Path: '\\Demo Group\\Warehouse' }
    ];
    const mockAttributes = [
        { Name: 'AssetTag', Value: '12345', DataType: 'String', IsInherited: false }
    ];

    window.api = {
        credentials: {
            save: async (profileName, credentials) => {
                const key = `profile_${profileName}`;
                localStorage.setItem(key, JSON.stringify(credentials));
                const profiles = JSON.parse(localStorage.getItem('profiles') || '[]');
                if (!profiles.includes(profileName)) {
                    profiles.push(profileName);
                    localStorage.setItem('profiles', JSON.stringify(profiles));
                }
                return { success: true };
            },
            get: async (profileName) => {
                const key = `profile_${profileName}`;
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : null;
            },
            list: async () => {
                return JSON.parse(localStorage.getItem('profiles') || '[]');
            },
            delete: async (profileName) => {
                const key = `profile_${profileName}`;
                localStorage.removeItem(key);
                const profiles = JSON.parse(localStorage.getItem('profiles') || '[]');
                const index = profiles.indexOf(profileName);
                if (index > -1) {
                    profiles.splice(index, 1);
                    localStorage.setItem('profiles', JSON.stringify(profiles));
                }
                return { success: true };
            }
        },
        file: {
            openDialog: async () => null,
            parse: async () => ({ success: false, error: 'File import is available in the Electron app.' })
        },
        soti: {
            getToken: async () => ({ success: true, token: 'browser-demo-token' }),
            getGroups: async () => ({ success: true, groups: mockGroups }),
            getCustomAttributes: async () => ({ success: true, attributes: mockAttributes }),
            getGroupCustomData: async () => ({ success: true, data: mockAttributes }),
            createCustomAttribute: async () => ({ success: true, data: null }),
            setGroupCustomAttribute: async (serverUrl, token, groupPath, attributeName, value) => {
                const existing = mockAttributes.find(attr => attr.Name === attributeName);
                if (existing) existing.Value = value;
                return { success: true };
            },
            request: async (serverUrl, token, endpoint, method = 'GET', body = null) => {
                const lowerEndpoint = String(endpoint).toLowerCase();
                if (lowerEndpoint === '/mobicontrol/api/customdata') {
                    return { success: true, data: [{ Name: 'AssetTag' }, { Name: 'DeviceConfig' }] };
                }
                if (lowerEndpoint === '/mobicontrol/api/customattributes') {
                    return { success: true, data: mockAttributes };
                }
                if (lowerEndpoint.includes('/devicegroups/') && lowerEndpoint.endsWith('/customattributes')) {
                    return { success: true, data: mockAttributes };
                }
                if (lowerEndpoint.includes('/devicegroups/')) {
                    return {
                        success: true,
                        data: {
                            Path: '\\Demo Group',
                            AreCustomAttributesInherited: false,
                            CustomAttributes: mockAttributes
                        }
                    };
                }
                return { success: true, data: body || {} };
            }
        }
    };
}
