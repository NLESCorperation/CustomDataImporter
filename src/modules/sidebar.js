// ==================== Sidebar Resizer & Settings Menu ====================
import { PREDEFINED_DATA } from './predefined.js';

function initSidebarResizer() {
    const sidebar = document.getElementById('sidebar');
    const resizer = document.getElementById('sidebar-resizer');

    if (!sidebar || !resizer) return;

    let isResizing = false;
    let startX = 0;
    let startWidth = 0;

    // Load saved width
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
            localStorage.setItem('sidebar-width', sidebar.offsetWidth.toString());
        }
    });
}

function countTotalDatapoints() {
    let predefinedCount = 0;
    for (const keys of Object.values(PREDEFINED_DATA)) {
        predefinedCount += keys.length;
    }

    const xsightCheckboxes = document.querySelectorAll('#xsight-items-list input[type="checkbox"]');
    const xsightCount = xsightCheckboxes.length;

    return predefinedCount + xsightCount;
}

function updateDatapointCount() {
    const countElement = document.getElementById('datapoint-count');
    if (countElement) {
        countElement.textContent = countTotalDatapoints();
    }
}

function initSettingsMenu() {
    const settingsMenu = document.querySelector('.settings-menu');
    const settingsToggle = document.getElementById('settings-menu-toggle');

    if (!settingsMenu || !settingsToggle) return;

    settingsMenu.classList.remove('expanded');

    settingsToggle.addEventListener('click', () => {
        settingsMenu.classList.toggle('expanded');
    });

    updateDatapointCount();
}

export function initSidebar() {
    initSidebarResizer();
    initSettingsMenu();
}
