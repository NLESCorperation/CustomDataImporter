// ==================== Theme Management ====================
import { state } from './state.js';
import { elements } from './dom.js';

export function applyTheme(theme) {
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

export function initTheme() {
    if (elements.themeSelect) {
        elements.themeSelect.addEventListener('change', (e) => {
            state.theme = e.target.value;
            applyTheme(state.theme);
        });
    }

    // Theme option buttons
    document.querySelectorAll('.theme-option[data-theme]').forEach(option => {
        option.addEventListener('click', () => {
            const theme = option.dataset.theme;
            state.theme = theme;
            applyTheme(theme);
        });
    });

    // Listen for system changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (state.theme === 'system') {
            applyTheme('system');
        }
    });

    applyTheme(state.theme);
}
