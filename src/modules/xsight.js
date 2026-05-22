// ==================== XSight Agent Data Picker ====================
import { elements } from './dom.js';
import { showToast } from './toast.js';
import { addDataItem } from './data-grid.js';

const XSIGHT_INI_FILE = '/sdcard/Download/XSightReport_AllJson.ini';

const XSIGHT_DATA_POINTS = [
    { key: 'mcAgentVersion', displayName: 'MC Agent Version' },
    { key: 'osVersion', displayName: 'OS Version' },
    { key: 'activeCollectors', displayName: 'XSight Active Collectors' },
    { key: 'activeCookers', displayName: 'XSight Active Cookers' },
    { key: 'activeLiveview', displayName: 'XSight Active Liveview' },
    { key: 'agentVersion', displayName: 'XSight Agent Version' },
    { key: 'batteryCapacity', displayName: 'XSight Battery Capacity' },
    { key: 'configuration.collectPeriod', displayName: 'XSight Configuration Collect Period' },
    { key: 'configuration.configurations', displayName: 'XSight Configuration Configurations' },
    { key: 'configuration.cookFrom', displayName: 'XSight Configuration Cook From' },
    { key: 'configuration.cookPeriod', displayName: 'XSight Configuration Cook Period' },
    { key: 'configuration.delivery', displayName: 'XSight Configuration Delivery' },
    { key: 'configuration.deliveryWindowLength', displayName: 'XSight Configuration Delivery Window Length' },
    { key: 'configuration.lastCollection', displayName: 'XSight Configuration Last Collection' },
    { key: 'configuration.nextCollection', displayName: 'XSight Configuration Next Collection' },
    { key: 'configuration.oldAppPreferences', displayName: 'XSight Configuration Old App Preferences' },
    { key: 'configuration.profileName', displayName: 'XSight Configuration Profile Name' },
    { key: 'connection', displayName: 'XSight Connection' },
    { key: 'lastCookStatus', displayName: 'XSight Cook Status' },
    { key: 'databaseSize', displayName: 'XSight Database Size' },
    { key: 'deviceId', displayName: 'XSight Device ID' },
    { key: 'keepRawData', displayName: 'XSight Keep Raw Data' },
    { key: 'lastUpload', displayName: 'XSight Last Upload' },
    { key: 'liveSupport.authState', displayName: 'XSight Live Support Auth State' },
    { key: 'liveSupport.installState', displayName: 'XSight Live Support Install State' },
    { key: 'liveSupport.networkState', displayName: 'XSight Live Support Network State' },
    { key: 'liveSupport.serviceBoundState', displayName: 'XSight Live Support Service Bound State' },
    { key: 'liveSupport.trustState', displayName: 'XSight Live Support Trust State' },
    { key: 'liveSupport.webSocketState', displayName: 'XSight Live Support Web Socket State' },
    { key: 'nextUpload', displayName: 'XSight Next Upload' },
    { key: 'serverAddress', displayName: 'XSight Server Address' },
    { key: 'smartSocketStatus', displayName: 'XSight Smart Socket Status' },
    { key: 'smartSocketVersion', displayName: 'XSight Smart Socket Version' }
];

const selectedXsightItems = new Set();

function updateXsightSelectedCount() {
    const count = selectedXsightItems.size;
    if (elements.xsightSelectedCount) {
        elements.xsightSelectedCount.textContent = `${count} selected`;
    }
    if (elements.addXsightSelectedBtn) {
        elements.addXsightSelectedBtn.disabled = count === 0;
    }
}

function renderXsightPicker(filterText = '') {
    const container = elements.xsightItemsList;
    if (!container) return;

    const filter = filterText.toLowerCase().trim();

    const filteredItems = XSIGHT_DATA_POINTS.filter(item =>
        !filter || item.key.toLowerCase().includes(filter) || item.displayName.toLowerCase().includes(filter)
    );

    if (filteredItems.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">No matching data points found</div>';
        return;
    }

    container.innerHTML = filteredItems.map(item => {
        const isSelected = selectedXsightItems.has(item.key);
        return `
            <label class="picker-item ${isSelected ? 'selected' : ''}">
                <input type="checkbox" data-key="${item.key}" ${isSelected ? 'checked' : ''} />
                <span>${item.displayName}</span>
            </label>
        `;
    }).join('');

    container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const key = e.target.dataset.key;
            if (e.target.checked) {
                selectedXsightItems.add(key);
            } else {
                selectedXsightItems.delete(key);
            }
            e.target.closest('.picker-item').classList.toggle('selected', e.target.checked);
            updateXsightSelectedCount();
        });
    });
}

export function initXsight() {
    renderXsightPicker();
    updateXsightSelectedCount();

    // Search
    elements.xsightSearch?.addEventListener('input', (e) => {
        renderXsightPicker(e.target.value);
    });

    // Select All
    elements.xsightSelectAllBtn?.addEventListener('click', () => {
        const filter = elements.xsightSearch?.value?.toLowerCase().trim() || '';
        XSIGHT_DATA_POINTS.forEach(item => {
            if (!filter || item.key.toLowerCase().includes(filter) || item.displayName.toLowerCase().includes(filter)) {
                selectedXsightItems.add(item.key);
            }
        });
        renderXsightPicker(elements.xsightSearch?.value || '');
        updateXsightSelectedCount();
    });

    // Select None
    elements.xsightSelectNoneBtn?.addEventListener('click', () => {
        selectedXsightItems.clear();
        renderXsightPicker(elements.xsightSearch?.value || '');
        updateXsightSelectedCount();
    });

    // Add selected items
    elements.addXsightSelectedBtn?.addEventListener('click', () => {
        if (selectedXsightItems.size === 0) {
            showToast('Please select at least one data point', 'error');
            return;
        }

        let addedCount = 0;
        selectedXsightItems.forEach(key => {
            const item = XSIGHT_DATA_POINTS.find(i => i.key === key);
            const displayName = item ? item.displayName : key;

            let section = 'Status';
            let valName = key;

            if (key.includes('.')) {
                const parts = key.split('.');
                section = parts[0];
                valName = parts.slice(1).join('.');
            }

            const itemValue = {
                type: 'ini',
                file: XSIGHT_INI_FILE,
                section: section,
                valName: valName,
                dataType: 'STRING',
                description: `XSight Agent - ${displayName}`,
                _originalKey: key
            };
            addDataItem(displayName, itemValue, true);
            addedCount++;
        });

        showToast(`Added ${addedCount} XSight data point${addedCount > 1 ? 's' : ''} to the list`, 'success');

        selectedXsightItems.clear();
        renderXsightPicker(elements.xsightSearch?.value || '');
        updateXsightSelectedCount();

        // Switch to the List tab
        document.querySelector('.tab[data-tab="list"]')?.click();
    });
}
