// ==================== Toast Notifications ====================
import { elements } from './dom.js';

function getToastIcon(type) {
    switch (type) {
        case 'success': return '✓';
        case 'error': return '✕';
        default: return 'ℹ';
    }
}

export function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${getToastIcon(type)}</span> ${message}`;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
