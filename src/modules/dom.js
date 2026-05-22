// ==================== DOM Element References ====================
// Cached DOM references — module scripts are deferred, so DOM is ready.

export const elements = {
    // Theme
    themeSelect: document.getElementById('theme-select'),

    // Status Bar
    statusBar: document.getElementById('status-bar'),
    statusText: document.getElementById('status-text'),

    // Connection
    connectionStatus: document.getElementById('connection-status'),
    connectionText: document.getElementById('connection-text'),
    profileSelect: document.getElementById('profile-select'),
    serverUrl: document.getElementById('server-url'),
    clientId: document.getElementById('client-id'),
    clientSecret: document.getElementById('client-secret'),
    username: document.getElementById('username'),
    password: document.getElementById('password'),
    connectBtn: document.getElementById('connect-btn'),
    saveProfileBtn: document.getElementById('save-profile-btn'),
    deleteProfileBtn: document.getElementById('delete-profile-btn'),
    renameProfileBtn: document.getElementById('rename-profile-btn'),
    newProfileBtn: document.getElementById('new-profile-btn'),

    // Groups
    groupList: document.getElementById('group-list'),
    groupSearch: document.getElementById('group-search'),
    refreshGroupsBtn: document.getElementById('refresh-groups-btn'),
    refreshGroupBtn: document.getElementById('refresh-group-btn'),

    // Selection
    selectAllBtn: document.getElementById('select-all-btn'),
    deselectAllBtn: document.getElementById('deselect-all-btn'),
    selectionCount: document.getElementById('selection-count'),

    // Manual Entry
    propName: document.getElementById('prop-name'),
    propType: document.getElementById('prop-type'),
    propDataType: document.getElementById('prop-datatype'),
    propDesc: document.getElementById('prop-desc'),

    // Dynamic Sections
    fieldsIni: document.getElementById('fields-ini'),

    // INI Inputs
    iniFile: document.getElementById('ini-file'),
    iniSection: document.getElementById('ini-section'),
    iniValName: document.getElementById('ini-val-name'),

    addManualBtn: document.getElementById('add-manual-btn'),

    // Predefined Data Picker
    predefinedSearch: document.getElementById('predefined-search'),
    predefinedPickerContent: document.getElementById('predefined-picker-content'),
    expandAllBtn: document.getElementById('expand-all-btn'),
    collapseAllBtn: document.getElementById('collapse-all-btn'),
    addSelectedPredefinedBtn: document.getElementById('add-selected-predefined-btn'),
    predefinedSelectedCount: document.getElementById('predefined-selected-count'),

    // XSight Agent Data Picker
    xsightSearch: document.getElementById('xsight-search'),
    xsightPickerContent: document.getElementById('xsight-picker-content'),
    xsightItemsList: document.getElementById('xsight-items-list'),
    xsightSelectAllBtn: document.getElementById('xsight-select-all-btn'),
    xsightSelectNoneBtn: document.getElementById('xsight-select-none-btn'),
    addXsightSelectedBtn: document.getElementById('add-xsight-selected-btn'),
    xsightSelectedCount: document.getElementById('xsight-selected-count'),

    // Data Grid
    dataTableBody: document.getElementById('data-table-body'),
    itemCount: document.getElementById('item-count'),

    // Actions
    clearAllBtn: document.getElementById('clear-all-btn'),
    applyBtn: document.getElementById('apply-btn'),

    // Save Profile Modal
    saveProfileModal: document.getElementById('save-profile-modal'),
    profileNameInput: document.getElementById('profile-name'),
    cancelSaveBtn: document.getElementById('cancel-save-btn'),
    confirmSaveBtn: document.getElementById('confirm-save-btn'),

    // Rename Profile Modal
    renameProfileModal: document.getElementById('rename-profile-modal'),
    renameProfileNameInput: document.getElementById('rename-profile-name'),
    cancelRenameBtn: document.getElementById('cancel-rename-btn'),
    confirmRenameBtn: document.getElementById('confirm-rename-btn'),

    // Confirm Dialog Modal
    confirmDialogModal: document.getElementById('confirm-dialog-modal'),
    confirmDialogTitle: document.getElementById('confirm-dialog-title'),
    confirmDialogMessage: document.getElementById('confirm-dialog-message'),
    confirmDialogCancel: document.getElementById('confirm-dialog-cancel'),
    confirmDialogOk: document.getElementById('confirm-dialog-ok'),

    // Toast
    toastContainer: document.getElementById('toast-container')
};
