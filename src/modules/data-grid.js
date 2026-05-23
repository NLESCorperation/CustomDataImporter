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

function removeButtonHtml(key) {
    return `
        <button class="delete-row-btn" data-key="${escapeHtml(key || '')}" title="Remove" aria-label="Remove data item">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
        </button>
    `;
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

function propertyNameCellHtml(item) {
    const displayName = item.value.description || formatKeyForDisplay(item.key);
    const shouldShowKey = item.key && displayName !== item.key;
    const keyMeta = shouldShowKey ? `<code class="data-key-meta">${escapeHtml(item.key)}</code>` : '';

    return `
        <div class="data-property-name">
            <span>${escapeHtml(displayName)}</span>
            ${keyMeta}
        </div>
    `;
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
                    <td>${removeButtonHtml(item.key)}</td>
                </tr>
            `;
        }
        return `
            <tr>
                <td>${propertyNameCellHtml(item)}</td>
                <td><span class="badge ${item.value.type}">${item.value.type.toUpperCase()}</span></td>
                <td>${formatValueDetails(item.value)}</td>
                <td>${removeButtonHtml(item.key)}</td>
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
