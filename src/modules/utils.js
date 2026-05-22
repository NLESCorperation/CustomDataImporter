// ==================== Utility Functions ====================

export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function formatKeyForDisplay(key) {
    return key.replace(/([a-z])([A-Z])/g, '$1 $2');
}

export function toPascalCase(str) {
    if (!str) return 'String';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function fixServerUrl(url) {
    if (!url) return url;

    let fixed = url.trim();

    // Remove trailing slashes
    fixed = fixed.replace(/\/+$/, '');

    // If no protocol, add https://
    if (!fixed.match(/^https?:\/\//i)) {
        fixed = fixed.replace(/^https?:?\/?/i, '');
        fixed = 'https://' + fixed;
    }

    // Convert http:// to https://
    if (fixed.toLowerCase().startsWith('http://')) {
        fixed = 'https://' + fixed.substring(7);
    }

    return fixed;
}

export function setButtonLoading(btn, isLoading, text) {
    if (isLoading) {
        btn._originalContent = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<span class="btn-spinner" aria-hidden="true"></span> ${escapeHtml(text || 'Loading...')}`;
    } else {
        btn.disabled = false;
        if (btn._originalContent !== undefined) {
            btn.innerHTML = btn._originalContent;
            delete btn._originalContent;
        }
    }
}

export function formatValueDetails(val) {
    if (val.type === 'ini') return `File: <b>${escapeHtml(val.file)}</b> | [${escapeHtml(val.section)}] ${escapeHtml(val.valName)}`;
    if (val.type === 'xml') return `File: <b>${escapeHtml(val.file)}</b> | XPath: ${escapeHtml(val.xpath)}`;
    if (val.type === 'static' || val.type === 'existing') return `<span class="badge static">STATIC</span> ${escapeHtml(val.value)}`;
    return JSON.stringify(val);
}
