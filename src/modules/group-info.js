// ==================== Group Data Fetching ====================
import { state } from './state.js';
import { showToast } from './toast.js';
import { updateStatusBar, hideStatusBar } from './status-bar.js';
import { getCustomDataDefinitions, sotiApiRequest, getGroupCustomData, updateCustomAttributeValue } from './api.js';
import { renderDataGrid } from './data-grid.js';

function extractEnabledStatus(cd) {
    if (cd.enabled !== undefined) return cd.enabled === true || cd.enabled === 'true' || cd.enabled === 1;
    if (cd.Enabled !== undefined) return cd.Enabled === true || cd.Enabled === 'true' || cd.Enabled === 1;
    if (cd.isEnabled !== undefined) return cd.isEnabled === true || cd.isEnabled === 'true' || cd.isEnabled === 1;
    if (cd.IsEnabled !== undefined) return cd.IsEnabled === true || cd.IsEnabled === 'true' || cd.IsEnabled === 1;
    if (cd.active !== undefined) return cd.active === true || cd.active === 'true' || cd.active === 1;
    if (cd.Active !== undefined) return cd.Active === true || cd.Active === 'true' || cd.Active === 1;
    if (typeof cd === 'string') return true;
    return true;
}

function extractCustomDataName(cd) {
    if (typeof cd === 'string') return cd.toLowerCase();
    return (cd.name || cd.Name || cd.key || cd.Key || '').toLowerCase();
}

function processCustomDataArray(items, activeCustomDataMap) {
    if (!Array.isArray(items)) return;
    items.forEach(cd => {
        if (!cd) return;
        const name = extractCustomDataName(cd);
        if (name) {
            const enabled = typeof cd === 'string' ? true : extractEnabledStatus(cd);
            activeCustomDataMap.set(name, enabled);
        }
    });
}

function tryParseJSON(value) {
    if (typeof value !== 'string') return value;
    try { return JSON.parse(value); } catch { return value; }
}

function processConfigValue(configValue, activeCustomDataMap) {
    if (Array.isArray(configValue)) {
        processCustomDataArray(configValue, activeCustomDataMap);
    } else if (configValue && typeof configValue === 'object') {
        const metadataKeys = ['$type', 'name', 'originname', 'isinherited', 'value', 'datatype', 'Name', 'OriginName', 'IsInherited', 'Value', 'DataType'];
        const actualKeys = Object.keys(configValue).filter(key => !metadataKeys.includes(key));

        if (metadataKeys.some(key => configValue.hasOwnProperty(key))) {
            const nestedValue = configValue.value || configValue.Value || configValue.CustomAttributeValue || configValue.StringValue;
            if (nestedValue) {
                const parsed = tryParseJSON(nestedValue);
                processConfigValue(parsed, activeCustomDataMap);
            }
        } else if (actualKeys.length > 0) {
            const firstValue = configValue[actualKeys[0]];
            if (typeof firstValue === 'boolean' || typeof firstValue === 'string' || typeof firstValue === 'number') {
                actualKeys.forEach(key => {
                    const val = configValue[key];
                    const enabled = typeof val === 'boolean' ? val : (val === true || val === 'true' || val === 1 || val === '1' || val === 'enabled');
                    activeCustomDataMap.set(key.toLowerCase(), enabled);
                });
            } else {
                const items = configValue.items || configValue.CustomData || configValue.customData;
                if (Array.isArray(items)) {
                    processCustomDataArray(items, activeCustomDataMap);
                }
            }
        }
    }
}

function findCustomDataConfigAttr(attributes) {
    if (Array.isArray(attributes)) {
        return attributes.find(attr => (attr.name || attr.Name || '').toLowerCase() === 'customdataconfig');
    }
    if (attributes && typeof attributes === 'object') {
        return attributes.CustomDataConfig || attributes.customDataConfig || null;
    }
    return null;
}

function extractConfigFromAttr(attr) {
    if (!attr) return null;
    let configValue = attr.value || attr.Value || attr.CustomAttributeValue || attr.StringValue;
    if (configValue === undefined || configValue === null) configValue = attr;
    return tryParseJSON(configValue);
}

function processGroupObject(group, activeCustomDataNames, activeCustomDataMap) {
    // 1. Check CustomData array
    if (group.CustomData && Array.isArray(group.CustomData)) {
        group.CustomData.forEach(cd => {
            const name = extractCustomDataName(cd);
            if (name) {
                activeCustomDataNames.add(name);
                activeCustomDataMap.set(name, extractEnabledStatus(cd));
            }
        });
    }

    // 2. Check EnabledCustomData array
    if (group.EnabledCustomData && Array.isArray(group.EnabledCustomData)) {
        group.EnabledCustomData.forEach(cd => {
            const name = extractCustomDataName(cd);
            if (name) {
                activeCustomDataNames.add(name);
                activeCustomDataMap.set(name, true);
            }
        });
    }

    // 3. Check customData (lowercase)
    if (group.customData && Array.isArray(group.customData)) {
        group.customData.forEach(cd => {
            const name = extractCustomDataName(cd);
            if (name) {
                activeCustomDataNames.add(name);
                activeCustomDataMap.set(name, extractEnabledStatus(cd));
            }
        });
    }

    // 4. Check CustomDataConfig
    if (group.CustomDataConfig) {
        const config = tryParseJSON(group.CustomDataConfig);
        processConfigValue(config, activeCustomDataMap);
    }

    // 4b. Check customAttributes array
    const configAttrLower = findCustomDataConfigAttr(group.customAttributes);
    if (configAttrLower) {
        const configValue = extractConfigFromAttr(configAttrLower);
        processConfigValue(configValue, activeCustomDataMap);
    }

    // 4c. Check CustomAttributes (capitalized)
    const configAttrUpper = findCustomDataConfigAttr(group.CustomAttributes);
    if (configAttrUpper) {
        const configValue = extractConfigFromAttr(configAttrUpper);
        processConfigValue(configValue, activeCustomDataMap);
    }

    // 5. Check AdvancedConfiguration
    if (group.AdvancedConfiguration) {
        const advConfig = tryParseJSON(group.AdvancedConfiguration);
        if (advConfig && advConfig.CustomData && Array.isArray(advConfig.CustomData)) {
            processCustomDataArray(advConfig.CustomData, activeCustomDataMap);
        }
    }

    // 6. Check other possible fields
    const possibleFields = [
        'CustomDataConfiguration', 'CustomDataSettings', 'EnabledCustomDataDefinitions',
        'CustomDataDefinitions', 'CustomDataList', 'ActiveCustomData'
    ];

    possibleFields.forEach(fieldName => {
        if (group[fieldName]) {
            const fieldValue = tryParseJSON(group[fieldName]);
            if (Array.isArray(fieldValue)) {
                processCustomDataArray(fieldValue, activeCustomDataMap);
            }
        }
    });
}

export async function fetchAndDisplayGroupData(groupPath) {
    if (!state.isConnected) return;

    state.currentlyViewedGroup = groupPath;

    const titleElement = document.getElementById('group-info-title');
    if (titleElement) {
        const groupName = groupPath.split('\\').pop() || groupPath;
        titleElement.textContent = `Current Group Data: ${groupName}`;
    }

    // Update visual indicator
    document.querySelectorAll('.group-item').forEach(item => item.classList.remove('viewing'));
    if (state.currentlyViewedGroup) {
        const viewedGroup = document.querySelector(`.group-item[data-path="${CSS.escape(state.currentlyViewedGroup)}"]`);
        if (viewedGroup) viewedGroup.classList.add('viewing');
    }

    updateStatusBar('Fetching group custom data...', 'info', true);

    // Preserve manually added items
    state.dataItems = state.dataItems.filter(item => item._manuallyAdded === true);
    renderDataGrid();

    try {
        const customDataDefinitions = await getCustomDataDefinitions(state.serverUrl, state.token);

        const encodedPath = encodeURIComponent(groupPath);
        const activeCustomDataNames = new Set();
        const activeCustomDataMap = new Map();

        // Fetch group object
        try {
            let group = null;
            try {
                group = await sotiApiRequest(state.serverUrl, state.token, `/MobiControl/api/devicegroups/${encodedPath}?fields=CustomData`);
            } catch {
                try {
                    group = await sotiApiRequest(state.serverUrl, state.token, `/MobiControl/api/devicegroups/${encodedPath}`);
                } catch (e2) {
                    console.warn('Failed to fetch group:', e2.message);
                }
            }

            if (group) {
                processGroupObject(group, activeCustomDataNames, activeCustomDataMap);
            }
        } catch (err) {
            console.warn('Failed to fetch group CustomData info:', err);
        }

        // Try fetching CustomData from group endpoint
        try {
            const groupCustomData = await sotiApiRequest(state.serverUrl, state.token, `/MobiControl/api/devicegroups/${encodedPath}/customdata`);
            if (Array.isArray(groupCustomData)) {
                processCustomDataArray(groupCustomData, activeCustomDataMap);
            } else if (groupCustomData && typeof groupCustomData === 'object') {
                const items = groupCustomData.items || groupCustomData.CustomData || Object.values(groupCustomData);
                if (Array.isArray(items)) processCustomDataArray(items, activeCustomDataMap);
            }
        } catch {
            // This endpoint might not exist
        }

        // Check customAttributes for CustomDataConfig
        try {
            const customAttributes = await sotiApiRequest(state.serverUrl, state.token, `/MobiControl/api/devicegroups/${encodedPath}/customAttributes`);
            const configAttr = findCustomDataConfigAttr(customAttributes);
            if (configAttr) {
                const configValue = extractConfigFromAttr(configAttr);
                processConfigValue(configValue, activeCustomDataMap);
            }
        } catch {
            // optional
        }

        // Fetch Custom Attributes for the group
        let customAttributes = [];
        try {
            const groupCustomData = await getGroupCustomData(state.serverUrl, state.token, groupPath);
            customAttributes = groupCustomData.attributes || [];
        } catch (err) {
            console.warn('Failed to fetch custom attributes:', err);
        }

        // Render CustomData table
        let count = 0;
        const tableBody = document.getElementById('group-info-body');
        if (tableBody) {
            tableBody.innerHTML = '';

            if (customDataDefinitions && customDataDefinitions.length > 0) {
                customDataDefinitions.forEach(def => {
                    const tr = document.createElement('tr');
                    const td = document.createElement('td');
                    const name = def.name || def.Name || 'Unknown';
                    td.textContent = name;
                    tr.appendChild(td);
                    tableBody.appendChild(tr);
                    count++;
                });
            } else {
                tableBody.innerHTML = '<tr><td colspan="1" class="placeholder-cell">No CustomData definitions found in the system.</td></tr>';
            }
        }

        const customDataCountBadge = document.getElementById('customdata-count');
        if (customDataCountBadge) {
            customDataCountBadge.textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
        }

        if (count > 0) {
            showToast(`Loaded ${count} CustomData definitions`, 'success');
            updateStatusBar(`Loaded ${count} CustomData definitions`, 'success');
        } else {
            updateStatusBar('No CustomData definitions found', 'info');
        }

        // Render Custom Attributes table (editable)
        const attributesTableBody = document.getElementById('group-attributes-body');
        if (attributesTableBody) {
            attributesTableBody.innerHTML = '';

            const displayAttributes = customAttributes.filter(attr => {
                const name = (attr.Name || attr.name || '').toLowerCase();
                return name !== 'customdataconfig';
            });

            if (displayAttributes && displayAttributes.length > 0) {
                displayAttributes.forEach(attr => {
                    const tr = document.createElement('tr');
                    const name = attr.Name || attr.name || 'Unknown';
                    const value = attr.Value !== undefined ? attr.Value : '';
                    const displayValue = value !== null && value !== undefined ? String(value) : '';
                    const isInherited = attr.IsInherited || attr.isInherited || false;

                    const nameCell = document.createElement('td');
                    nameCell.appendChild(document.createTextNode(name));
                    if (isInherited) {
                        const inheritedBadge = document.createElement('span');
                        inheritedBadge.style.fontSize = '10px';
                        inheritedBadge.style.color = 'var(--text-secondary)';
                        inheritedBadge.style.marginLeft = '4px';
                        inheritedBadge.title = 'Inherited from parent group';
                        inheritedBadge.textContent = '(inherited)';
                        nameCell.appendChild(inheritedBadge);
                    }

                    const valueCell = document.createElement('td');
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.className = 'attr-value-input';
                    input.dataset.attrName = name;
                    input.dataset.originalValue = displayValue;
                    input.value = displayValue;
                    input.style.width = '100%';
                    input.style.padding = '6px 8px';
                    input.style.border = '1px solid var(--border-color)';
                    input.style.borderRadius = 'var(--radius-sm)';
                    input.style.background = 'var(--bg-elevated)';
                    input.style.color = 'var(--text-main)';
                    input.placeholder = 'Enter value...';
                    valueCell.appendChild(input);

                    const actionCell = document.createElement('td');
                    actionCell.style.textAlign = 'center';
                    const saveButton = document.createElement('button');
                    saveButton.className = 'btn btn-primary btn-small save-attr-btn';
                    saveButton.dataset.attrName = name;
                    saveButton.style.padding = '4px 10px';
                    saveButton.style.fontSize = '12px';
                    saveButton.disabled = true;
                    saveButton.textContent = 'Save';
                    actionCell.appendChild(saveButton);

                    tr.append(nameCell, valueCell, actionCell);
                    attributesTableBody.appendChild(tr);
                });

                // Input change listeners
                attributesTableBody.querySelectorAll('.attr-value-input').forEach(input => {
                    input.addEventListener('input', (e) => {
                        const originalValue = e.target.dataset.originalValue || '';
                        const currentValue = e.target.value;
                        const saveBtn = e.target.closest('tr').querySelector('.save-attr-btn');

                        if (currentValue !== originalValue) {
                            saveBtn.disabled = false;
                            saveBtn.classList.add('btn-changed');
                        } else {
                            saveBtn.disabled = true;
                            saveBtn.classList.remove('btn-changed');
                        }
                    });

                    input.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            const saveBtn = e.target.closest('tr').querySelector('.save-attr-btn');
                            if (!saveBtn.disabled) saveBtn.click();
                        }
                    });
                });

                // Save button listeners
                attributesTableBody.querySelectorAll('.save-attr-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const attrName = e.target.dataset.attrName;
                        const input = e.target.closest('tr').querySelector('.attr-value-input');
                        const newValue = input.value;
                        await updateCustomAttributeValue(state.serverUrl, state.token, groupPath, attrName, newValue, e.target, input);
                    });
                });
            } else {
                attributesTableBody.innerHTML = '<tr><td colspan="3" class="placeholder-cell">No Custom Attributes found for this group.</td></tr>';
            }
        }

    } catch (error) {
        console.error('Group data fetch error:', error);
        updateStatusBar('Failed to fetch group data', 'error');
    } finally {
        setTimeout(() => hideStatusBar(), 3000);
    }
}
