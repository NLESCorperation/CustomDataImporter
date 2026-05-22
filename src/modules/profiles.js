// ==================== Profile Management ====================
import { state } from './state.js';
import { elements } from './dom.js';
import { showToast } from './toast.js';
import { showConfirmDialog, openModal, closeModal } from './modal.js';
import { fixServerUrl, setButtonLoading } from './utils.js';
import { getSotiToken, getSotiGroups } from './api.js';
import { refreshGroups } from './groups.js';

function updateConnectionStatus(connected) {
    const dot = elements.connectionStatus.querySelector('.status-dot');
    if (connected) {
        dot.classList.remove('disconnected');
        dot.classList.add('connected');
        const hostname = state.serverUrl ? new URL(state.serverUrl).hostname : 'Connected';
        if (state.currentProfile) {
            elements.connectionText.textContent = `${hostname} (${state.currentProfile})`;
        } else {
            elements.connectionText.textContent = hostname;
        }
        elements.refreshGroupsBtn.disabled = false;
    } else {
        dot.classList.remove('connected');
        dot.classList.add('disconnected');
        elements.connectionText.textContent = 'Not Connected';
        elements.refreshGroupsBtn.disabled = true;
    }
}

export async function connectToServer() {
    const serverUrl = fixServerUrl(elements.serverUrl.value);
    elements.serverUrl.value = serverUrl;

    const clientId = elements.clientId.value.trim();
    const clientSecret = elements.clientSecret.value;
    const username = elements.username.value.trim();
    const password = elements.password.value;

    if (!serverUrl || !clientId || !clientSecret || !username || !password) {
        showToast('Please fill in all connection fields', 'error');
        return;
    }

    setButtonLoading(elements.connectBtn, true, 'Connecting...');

    try {
        state.token = await getSotiToken(serverUrl, clientId, clientSecret, username, password);
        state.serverUrl = serverUrl;
        state.isConnected = true;

        updateConnectionStatus(true);
        showToast('Connected successfully!', 'success');

        await refreshGroups();

        const manualTab = document.querySelector('[data-tab="manual"]');
        if (manualTab) manualTab.click();

    } catch (error) {
        console.error('Connection error:', error);
        showToast(error.message, 'error');
        updateConnectionStatus(false);
    } finally {
        setButtonLoading(elements.connectBtn, false);
    }
}

export async function loadProfiles() {
    try {
        const profiles = await window.api.credentials.list();
        elements.profileSelect.innerHTML = '<option value="">-- Select Saved Profile --</option>';
        profiles.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            elements.profileSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Failed to load profiles:', error);
    }
}

async function loadProfile(profileName) {
    const credentials = await window.api.credentials.get(profileName);
    if (credentials) {
        elements.serverUrl.value = credentials.serverUrl || '';
        elements.clientId.value = credentials.clientId || '';
        elements.clientSecret.value = credentials.clientSecret || '';
        elements.username.value = credentials.username || '';
        elements.password.value = credentials.password || '';
        state.currentProfile = profileName;
    }
}

function clearCredentialForm() {
    elements.serverUrl.value = '';
    elements.clientId.value = '';
    elements.clientSecret.value = '';
    elements.username.value = '';
    elements.password.value = '';
    state.currentProfile = null;
}

async function saveProfile() {
    const profileName = elements.profileNameInput.value.trim();
    if (!profileName) {
        showToast('Please enter a profile name', 'error');
        elements.profileNameInput.focus();
        return;
    }

    if (!elements.serverUrl.value.trim()) {
        showToast('Please enter a server URL before saving', 'error');
        closeModal(elements.saveProfileModal);
        elements.serverUrl.focus();
        return;
    }

    const fixedUrl = fixServerUrl(elements.serverUrl.value);
    elements.serverUrl.value = fixedUrl;

    const credentials = {
        serverUrl: fixedUrl,
        clientId: elements.clientId.value.trim(),
        clientSecret: elements.clientSecret.value,
        username: elements.username.value.trim(),
        password: elements.password.value
    };

    try {
        const result = await window.api.credentials.save(profileName, credentials);

        if (result.success) {
            showToast(`Profile "${profileName}" saved securely`, 'success');
            closeModal(elements.saveProfileModal);
            state.currentProfile = profileName;
            await loadProfiles();
            elements.profileSelect.value = profileName;
        } else {
            showToast(`Failed to save: ${result.error}`, 'error');
        }
    } catch (error) {
        console.error(`[Save Profile] Error:`, error);
        showToast(`Failed to save profile: ${error.message}`, 'error');
    }
}

export function initProfiles() {
    // Profile select change
    elements.profileSelect.addEventListener('change', async () => {
        const profileName = elements.profileSelect.value;
        if (profileName) {
            await loadProfile(profileName);
            showToast(`Loaded profile: ${profileName}`, 'info');
            await connectToServer();
        } else {
            clearCredentialForm();
        }
    });

    // New profile
    elements.newProfileBtn.addEventListener('click', () => {
        elements.profileSelect.value = "";
        clearCredentialForm();
        showToast('Fields cleared for new connection', 'info');
    });

    // URL auto-correction on blur
    elements.serverUrl.addEventListener('blur', () => {
        const url = elements.serverUrl.value.trim();
        if (url) {
            const fixed = fixServerUrl(url);
            if (fixed !== url) {
                elements.serverUrl.value = fixed;
            }
        }
    });

    // Save profile button -> open modal
    elements.saveProfileBtn.addEventListener('click', () => {
        if (elements.serverUrl.value.trim()) {
            elements.serverUrl.value = fixServerUrl(elements.serverUrl.value);
        }

        if (state.currentProfile) {
            elements.profileNameInput.value = state.currentProfile;
        } else {
            const serverUrl = elements.serverUrl.value.trim();
            if (serverUrl) {
                try {
                    const hostname = new URL(serverUrl).hostname;
                    elements.profileNameInput.value = hostname.split('.')[0] || '';
                } catch {
                    elements.profileNameInput.value = '';
                }
            } else {
                elements.profileNameInput.value = '';
            }
        }
        openModal(elements.saveProfileModal);
    });

    elements.cancelSaveBtn.addEventListener('click', () => {
        closeModal(elements.saveProfileModal);
    });

    elements.profileNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            elements.confirmSaveBtn.click();
        }
    });

    elements.saveProfileModal.addEventListener('click', (e) => {
        if (e.target === elements.saveProfileModal) {
            closeModal(elements.saveProfileModal);
        }
    });

    elements.saveProfileModal._closeAction = () => closeModal(elements.saveProfileModal);

    elements.confirmSaveBtn.addEventListener('click', saveProfile);

    // Delete profile
    elements.deleteProfileBtn.addEventListener('click', async () => {
        const profileName = elements.profileSelect.value;
        if (!profileName) {
            showToast('Select a profile to delete', 'error');
            return;
        }

        const confirmed = await showConfirmDialog('Delete Profile', `Are you sure you want to delete "${profileName}"? This cannot be undone.`, 'Delete', true);
        if (confirmed) {
            await window.api.credentials.delete(profileName);
            showToast(`Deleted profile: ${profileName}`, 'success');
            await loadProfiles();
            clearCredentialForm();
        }
    });

    // Rename profile
    elements.renameProfileBtn.addEventListener('click', () => {
        const profileName = elements.profileSelect.value;
        if (!profileName) {
            showToast('Select a profile to rename', 'error');
            return;
        }

        elements.renameProfileNameInput.value = profileName;
        openModal(elements.renameProfileModal);
        elements.renameProfileNameInput.select();
    });

    elements.cancelRenameBtn.addEventListener('click', () => {
        closeModal(elements.renameProfileModal);
    });

    elements.renameProfileNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            elements.confirmRenameBtn.click();
        }
    });

    elements.renameProfileModal.addEventListener('click', (e) => {
        if (e.target === elements.renameProfileModal) {
            closeModal(elements.renameProfileModal);
        }
    });

    elements.renameProfileModal._closeAction = () => closeModal(elements.renameProfileModal);

    elements.confirmRenameBtn.addEventListener('click', async () => {
        const oldName = elements.profileSelect.value;
        const newName = elements.renameProfileNameInput.value.trim();

        if (!newName) {
            showToast('Please enter a new name', 'error');
            return;
        }

        if (newName === oldName) {
            closeModal(elements.renameProfileModal);
            return;
        }

        try {
            const credentials = await window.api.credentials.get(oldName);
            if (!credentials) {
                showToast('Could not read profile data', 'error');
                return;
            }

            await window.api.credentials.save(newName, credentials);
            await window.api.credentials.delete(oldName);

            state.currentProfile = newName;

            await loadProfiles();
            elements.profileSelect.value = newName;

            closeModal(elements.renameProfileModal);
            showToast(`Renamed profile to "${newName}"`, 'success');
        } catch (error) {
            console.error('Error renaming profile:', error);
            showToast(`Failed to rename profile: ${error.message}`, 'error');
        }
    });

    // Connect button
    elements.connectBtn.addEventListener('click', () => {
        connectToServer();
    });
}
