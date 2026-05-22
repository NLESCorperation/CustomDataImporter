// ==================== SOTI Custom Data Importer — Module Orchestrator ====================
// This file initializes all modules. ES module scripts are deferred, so the DOM is ready.

import { initTabs } from './modules/tabs.js';
import { initTheme } from './modules/theme.js';
import { loadProfiles, initProfiles } from './modules/profiles.js';
import { initGroups } from './modules/groups.js';
import { renderDataGrid, initDataGrid, updateApplyButton } from './modules/data-grid.js';
import { initApply } from './modules/apply.js';
import { initPredefined } from './modules/predefined.js';
import { initXsight } from './modules/xsight.js';
import { initManualEntry } from './modules/manual-entry.js';
import { initSidebar } from './modules/sidebar.js';

// Initialize all modules
async function init() {
    // UI chrome
    initTabs();
    initTheme();
    initSidebar();

    // Data entry
    initDataGrid();
    initPredefined();
    initXsight();
    initManualEntry();

    // Groups & apply
    initGroups();
    initApply();

    // Profiles & connection (async — loads saved profiles)
    initProfiles();
    await loadProfiles();

    // Initial render
    renderDataGrid();
    updateApplyButton();
}

init().catch(err => console.error('Initialization failed:', err));
