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
        }
    };
}
