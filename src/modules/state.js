// ==================== State Management ====================
const listeners = {};

export const state = {
    isConnected: false,
    token: null,
    serverUrl: null,
    groups: [],
    selectedGroups: [],
    dataItems: [],
    currentProfile: null,
    theme: localStorage.getItem('theme') || 'light',
    currentlyViewedGroup: null,
    expandedGroups: new Set()
};

export function setState(key, value) {
    state[key] = value;
    (listeners[key] || []).forEach(fn => fn(value));
}

export function onStateChange(key, fn) {
    if (!listeners[key]) listeners[key] = [];
    listeners[key].push(fn);
}
