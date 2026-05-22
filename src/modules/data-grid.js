// ==================== Data Grid ====================
import { state } from './state.js';
import { elements } from './dom.js';
import { showToast } from './toast.js';
import { showConfirmDialog } from './modal.js';
import { escapeHtml, formatKeyForDisplay, formatValueDetails } from './utils.js';

function updateStagedCount() {
    const count = state.dataItems.length;

    const el = document.getElementById('staged-count');
    if (el) {
        el.textContent = `(${count})`;
    }

    const tabBadge = document.getElementById('staged-count-tab');
    if (tabBadge) {
        tabBadge.textContent = `(${count})`;
    }
}

export function addDataItem(key, value, isManuallyAdded = false) {
    const existing = state.dataItems.findIndex(d => d.key === key);
    if (existing !== -1) {
        state.dataItems[existing].value = value;
        if (isManuallyAdded || state.dataItems[existing]._manuallyAdded) {
            state.dataItems[existing]._manuallyAdded = true;
        }
    } else {
        state.dataItems.push({ key, value, _manuallyAdded: isManuallyAdded });
    }

    renderDataGrid();
    updateApplyButton();

    if (elements.dataTableBody) {
        setTimeout(() => elements.dataTableBody.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    }
}

export function removeDataItem(key) {
    state.dataItems = state.dataItems.filter(d => d.key !== key);
    renderDataGrid();
    updateApplyButton();
}

export function renderDataGrid() {
    updateStagedCount();

    if (state.dataItems.length === 0) {
        elements.dataTableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="4" class="empty-message">No data added yet</td>
            </tr>
        `;
        return;
    }

    elements.dataTableBody.innerHTML = state.dataItems.map(item => {
        if (!item.value || typeof item.value !== 'object' || !item.value.type) {
            console.error('Invalid item structure in renderDataGrid:', item);
            return `
                <tr style="background-color: var(--error-bg, #fee);">
                    <td>${escapeHtml(formatKeyForDisplay(item.key || 'Unknown'))}</td>
                    <td><span class="badge error">ERROR</span></td>
                    <td>Invalid structure - please remove and re-add</td>
                    <td>
                        <button class="delete-row-btn" data-key="${escapeHtml(item.key || '')}" title="Remove">🗑️</button>
                    </td>
                </tr>
            `;
        }
        return `
            <tr>
                <td>${escapeHtml(item.value.description || formatKeyForDisplay(item.key))}</td>
                <td><span class="badge ${item.value.type}">${item.value.type.toUpperCase()}</span></td>
                <td>${formatValueDetails(item.value)}</td>
                <td>
                    <button class="delete-row-btn" data-key="${escapeHtml(item.key)}" title="Remove">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');

    elements.dataTableBody.querySelectorAll('.delete-row-btn').forEach(btn => {
        btn.addEventListener('click', () => removeDataItem(btn.dataset.key));
    });
}

export function updateApplyButton() {
    const canApply = state.dataItems.length > 0 &&
        state.selectedGroups.length > 0 &&
        state.isConnected;

    elements.applyBtn.disabled = !canApply;

    if (state.selectedGroups.length > 0) {
        elements.applyBtn.textContent = `Apply to ${state.selectedGroups.length} Group${state.selectedGroups.length === 1 ? '' : 's'}`;
    } else {
        elements.applyBtn.textContent = 'Apply to Selected Groups';
    }
}

export function initDataGrid() {
    elements.clearAllBtn.addEventListener('click', async () => {
        if (state.dataItems.length > 0) {
            const confirmed = await showConfirmDialog('Clear All Data', `Remove all ${state.dataItems.length} data item${state.dataItems.length === 1 ? '' : 's'} from the staging area?`, 'Clear All', true);
            if (confirmed) {
                state.dataItems = [];
                renderDataGrid();
                updateApplyButton();
                showToast('Cleared all data items', 'info');
            }
        }
    });
}
