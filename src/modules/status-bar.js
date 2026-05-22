// ==================== Status Bar Management ====================
import { elements } from './dom.js';

export function updateStatusBar(message, type = 'info', loading = false) {
    if (!elements.statusBar) return;

    elements.statusBar.classList.add('visible');
    elements.statusText.textContent = message;

    if (loading) {
        elements.statusBar.classList.add('loading');
    } else {
        elements.statusBar.classList.remove('loading');
    }
}

export function hideStatusBar() {
    if (!elements.statusBar) return;
    elements.statusBar.classList.remove('visible', 'loading');
}
