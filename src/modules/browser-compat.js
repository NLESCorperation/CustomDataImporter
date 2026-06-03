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
    const mockProfiles = new Map();

    window.api = {
        credentials: {
            save: async (profileName, credentials) => {
                mockProfiles.set(profileName, { ...credentials });
                return { success: true };
            },
            get: async (profileName) => {
                const credentials = mockProfiles.get(profileName);
                return credentials ? { ...credentials } : null;
            },
            list: async () => {
                return [...mockProfiles.keys()];
            },
            delete: async (profileName) => {
                mockProfiles.delete(profileName);
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
                if (String(method).toUpperCase() === 'DELETE' && lowerEndpoint.startsWith('/mobicontrol/api/customdata/')) {
                    return { success: true, data: {} };
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
