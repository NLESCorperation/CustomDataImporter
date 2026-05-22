// ==================== SOTI API Integration ====================
// All API calls are routed through the main process to bypass CORS restrictions

export async function getSotiToken(serverUrl, clientId, clientSecret, username, password) {
    const result = await window.api.soti.getToken(serverUrl, clientId, clientSecret, username, password);
    if (!result.success) {
        throw new Error(result.error || 'Authentication failed');
    }
    return result.token;
}

export async function getSotiGroups(serverUrl, token) {
    const result = await window.api.soti.getGroups(serverUrl, token);
    if (!result.success) {
        throw new Error(result.error || 'Failed to fetch groups');
    }
    const data = result.groups;
    return Array.isArray(data) ? data : (data.items || data);
}

// Helper function for generic SOTI API requests via main process
export async function sotiApiRequest(serverUrl, token, endpoint, method = 'GET', body = null) {
    const result = await window.api.soti.request(serverUrl, token, endpoint, method, body);
    if (!result.success) {
        throw new Error(result.error || 'API request failed');
    }
    return result.data;
}

// ==================== CustomData Definitions API ====================
export async function getCustomDataDefinitions(serverUrl, token) {
    try {
        const data = await sotiApiRequest(serverUrl, token, '/MobiControl/api/customdata');
        return Array.isArray(data) ? data : (data.items || []);
    } catch (error) {
        console.warn('Failed to fetch custom data definitions:', error);
        return [];
    }
}

export async function createCustomDataDefinition(serverUrl, token, definition) {
    console.log(`[SOTI API] Creating CustomData definition:`, definition);
    try {
        const result = await sotiApiRequest(serverUrl, token, '/MobiControl/api/customdata', 'POST', definition);
        console.log(`[SOTI API] Successfully created CustomData definition:`, result);
        return result;
    } catch (error) {
        console.error(`[SOTI API] Error creating CustomData definition:`, error);
        throw error;
    }
}

export async function ensureCustomDataDefinitionExists(serverUrl, token, item) {
    const itemType = item.value?.type?.toLowerCase();
    if (itemType === 'xml') {
        console.warn(`[SOTI API] XML CustomData definitions cannot be created via the API.`);
        return {
            created: false,
            name: item.key,
            skipped: true,
            warning: `XML CustomData definition "${item.key}" must be created manually in SOTI web console. Config saved for reference.`
        };
    }
    if (itemType === 'json') {
        console.warn(`[SOTI API] JSON CustomData definitions cannot be created via the API.`);
        return {
            created: false,
            name: item.key,
            skipped: true,
            warning: `JSON CustomData definition "${item.key}" must be created manually in SOTI web console. Config saved for reference.`
        };
    }

    const keyForComparison = item.value?._originalKey || item.key;
    const definitions = await getCustomDataDefinitions(serverUrl, token);
    const exists = definitions.some(d => {
        const defName = (d.name || d.Name || '').toLowerCase();
        const comparisonKey = keyForComparison.toLowerCase();
        return defName === comparisonKey || defName === item.key.toLowerCase();
    });

    if (exists) {
        const existingDef = definitions.find(d => {
            const defName = (d.name || d.Name || '').toLowerCase();
            return defName === keyForComparison.toLowerCase() || defName === item.key.toLowerCase();
        });
        const existingName = existingDef?.name || existingDef?.Name || keyForComparison;
        console.log(`CustomData definition already exists: ${existingName} (checked against ${item.key})`);
        return { created: false, name: existingName, exists: true };
    }

    let deviceFamily = 'AndroidPlus';
    let physicalType = 'String';
    let deviceKinds = ['AndroidPlus', 'AndroidElm', 'AndroidForWork', 'AndroidKnox'];
    let expressionFormat = null;

    if (definitions.length > 0) {
        const sample = definitions[0];
        console.log(`[SOTI API] Sample existing CustomData definition:`, JSON.stringify(sample, null, 2));

        const deviceFamilyValue = sample.DeviceFamily || sample.deviceFamily;
        if (deviceFamilyValue && typeof deviceFamilyValue === 'string') {
            deviceFamily = deviceFamilyValue.trim();
        }

        const deviceKindsValue = sample.DeviceKinds || sample.deviceKinds;
        if (deviceKindsValue && Array.isArray(deviceKindsValue) && deviceKindsValue.length > 0) {
            deviceKinds = deviceKindsValue;
        }

        if (sample.expression || sample.Expression) {
            expressionFormat = sample.expression || sample.Expression;
        }
    }

    physicalType = 'String';

    const value = item.value;
    let definition = {
        Name: item.value?._originalKey || item.key,
        Description: value.description || '',
        PhysicalType: physicalType,
        DeviceFamily: deviceFamily,
        DeviceKinds: deviceKinds,
        Enabled: true
    };

    if (value.type === 'ini') {
        const file = value.file || '';
        const section = value.section || '';
        const valName = value.valName || '';

        let expression = '';
        if (file && section && valName) {
            expression = `INI://${file}?SC=${section}&NM=${valName}`;
        } else if (file && section) {
            expression = `INI://${file}?SC=${section}`;
        } else if (file) {
            expression = `INI://${file}`;
        } else {
            expression = `INI:///sdcard/${item.key}.ini?SC=${section || 'Default'}&NM=${valName || 'Value'}`;
            console.warn(`[SOTI API] Missing file path for INI, using fallback expression: ${expression}`);
        }
        definition.Expression = expression;

    } else if (value.type === 'xml') {
        const file = value.file || '';
        const xpath = value.xpath || '';

        let expression = '';
        if (file && xpath) {
            expression = `XML://${file}?${xpath}`;
        } else if (file) {
            expression = `XML://${file}`;
        } else {
            expression = `XML:///sdcard/${item.key}.xml?/`;
            console.warn(`[SOTI API] Missing file/xpath for XML, using fallback expression: ${expression}`);
        }
        definition.Expression = expression;

    } else {
        const staticVal = value.value !== undefined ? value.value : '';
        definition.Expression = String(staticVal || item.key);
    }

    if (!definition.Expression || definition.Expression.trim() === '') {
        definition.Expression = item.key;
    }

    console.log(`Creating CustomData definition for ${item.key}`);
    console.log(`[SOTI API] Expression: ${definition.Expression}`);

    try {
        await createCustomDataDefinition(serverUrl, token, definition);
        return { created: true, name: item.key };
    } catch (err) {
        if (err.message && err.message.toLowerCase().includes('already exists')) {
            console.log(`CustomData definition "${item.key}" already exists (detected from API response)`);
            return { created: false, name: item.key, exists: true };
        }
        console.warn(`Could not create CustomData definition ${item.key}:`, err.message);
        return { created: false, name: item.key, error: err.message };
    }
}

// ==================== Enable CustomData on Group ====================
export async function enableCustomDataOnGroup(serverUrl, token, groupPath, customDataName) {
    const encodedPath = encodeURIComponent(groupPath);

    console.log(`[SOTI API] Attempting to enable CustomData "${customDataName}" on group "${groupPath}"`);

    try {
        await sotiApiRequest(serverUrl, token, `/MobiControl/api/devicegroups/${encodedPath}/configurations`);
    } catch (e) {
        console.log(`[SOTI API] Configurations endpoint not available: ${e.message}`);
    }

    return {
        success: false,
        error: `Enabling CustomData on groups via API is not directly supported by SOTI. ` +
               `The definition "${customDataName}" was created successfully. ` +
               `To enable it on this group, please use the SOTI Console: ` +
               `Devices > select group > Settings > Device Info Panel > CustomData Manager > ` +
               `move "${customDataName}" from Available Items to Displayed Items.`
    };
}

// ==================== Custom Attribute Definitions API ====================
export async function getCustomAttributeDefinitions(serverUrl, token) {
    try {
        const data = await sotiApiRequest(serverUrl, token, '/MobiControl/api/customattributes');
        return Array.isArray(data) ? data : (data.items || []);
    } catch (error) {
        console.warn('Failed to fetch custom attribute definitions:', error);
        return [];
    }
}

export async function createCustomAttributeDefinition(serverUrl, token, definition) {
    return await sotiApiRequest(serverUrl, token, '/MobiControl/api/customattributes', 'POST', definition);
}

export async function ensureCustomAttributeExists(serverUrl, token, attributeName, dataType = 'Text') {
    const definitions = await getCustomAttributeDefinitions(serverUrl, token);
    const exists = definitions.some(d =>
        (d.name || d.Name || '').toLowerCase() === attributeName.toLowerCase()
    );

    if (!exists) {
        console.log(`Creating custom attribute definition: ${attributeName}`);
        try {
            await createCustomAttributeDefinition(serverUrl, token, {
                Name: attributeName,
                CustomAttributeDataType: dataType,
                PropagateToDevice: true,
                Description: "Created by CustomDataImporter"
            });
            return { created: true, name: attributeName };
        } catch (err) {
            if (err.message && err.message.toLowerCase().includes('already exists')) {
                console.log(`Custom attribute "${attributeName}" already exists (detected from API response)`);
                return { created: false, name: attributeName, exists: true };
            }
            console.warn(`Could not create attribute ${attributeName}:`, err.message);
            return { created: false, name: attributeName, error: err.message };
        }
    }

    return { created: false, name: attributeName, exists: true };
}

export async function getGroupCustomData(serverUrl, token, groupPath) {
    const encodedPath = encodeURIComponent(groupPath);

    try {
        const group = await sotiApiRequest(serverUrl, token, `/MobiControl/api/devicegroups/${encodedPath}`);

        const result = {
            config: [],
            attributes: [],
            inheritance: group.AreCustomAttributesInherited
        };

        let directAttributes = [];
        try {
            directAttributes = await sotiApiRequest(serverUrl, token, `/MobiControl/api/devicegroups/${encodedPath}/customAttributes`);
        } catch (e) {
            console.warn('Failed to fetch explicit custom attributes:', e);
        }

        const groupAttrs = group.CustomAttributes || group.customAttributes || [];

        const getAttrValue = (attr) => {
            if (attr.Value !== undefined && attr.Value !== null) return attr.Value;
            if (attr.value !== undefined && attr.value !== null) return attr.value;
            if (attr.CustomAttributeValue !== undefined && attr.CustomAttributeValue !== null) return attr.CustomAttributeValue;
            if (attr.StringValue !== undefined && attr.StringValue !== null) return attr.StringValue;
            if (attr.AttributeValue !== undefined && attr.AttributeValue !== null) return attr.AttributeValue;
            if (attr.attributeValue !== undefined && attr.attributeValue !== null) return attr.attributeValue;
            return '';
        };

        const attrMap = new Map();

        [...groupAttrs, ...directAttributes].forEach(a => {
            const name = a.Name || a.name;
            if (name) {
                const val = getAttrValue(a);
                attrMap.set(name.toLowerCase(), {
                    Name: name,
                    Value: val,
                    DataType: a.DataType || a.dataType || 'String',
                    IsInherited: a.IsInherited || a.isInherited || false
                });
            }
        });

        const configKey = 'customdataconfig';

        if (attrMap.has(configKey)) {
            const configAttr = attrMap.get(configKey);
            try {
                let parsed = configAttr.Value;
                if (typeof parsed === 'string') {
                    parsed = JSON.parse(parsed);
                }
                result.config = Array.isArray(parsed) ? parsed : (parsed.items || []);
            } catch (e) {
                console.error('Failed to parse CustomDataConfig JSON:', e);
            }
            attrMap.delete(configKey);
        }

        result.attributes = Array.from(attrMap.values());

        return result;

    } catch (error) {
        console.error('Error fetching group data:', error);
        return { config: [], attributes: [] };
    }
}

// ==================== Update Custom Attribute Value ====================
export async function updateCustomAttributeValue(serverUrl, token, groupPath, attributeName, newValue, saveBtn, input) {
    const originalBtnText = saveBtn.textContent;
    saveBtn.textContent = '...';
    saveBtn.disabled = true;

    try {
        const encodedPath = encodeURIComponent(groupPath);
        const encodedAttrName = encodeURIComponent(attributeName);
        const endpoint = `/MobiControl/api/devicegroups/${encodedPath}/customAttributes/${encodedAttrName}`;

        await sotiApiRequest(serverUrl, token, endpoint, 'PUT', newValue);

        input.dataset.originalValue = newValue;
        saveBtn.textContent = '✓';
        saveBtn.classList.remove('btn-changed');

        setTimeout(() => {
            saveBtn.textContent = 'Save';
        }, 1500);

        return { success: true };
    } catch (error) {
        console.error(`[SOTI API] Error updating attribute:`, error);

        let userMessage = error.message;
        const errMsg = error.message.toLowerCase();

        if (error.message.includes('422') || error.message.includes('2056') ||
            errMsg.includes('value type is correct') || errMsg.includes('type is correct')) {
            userMessage = `Type mismatch: The value "${newValue}" is not valid for "${attributeName}". Check the attribute's data type.`;
        } else if (error.message.includes('403')) {
            userMessage = `Permission denied: You don't have access to update "${attributeName}"`;
        } else if (error.message.includes('404')) {
            userMessage = `Attribute "${attributeName}" not found on this group`;
        } else if (error.message.includes('401')) {
            userMessage = `Authentication failed. Please reconnect to the server.`;
        }

        saveBtn.textContent = originalBtnText;
        saveBtn.disabled = false;

        return { success: false, error: userMessage };
    }
}

// ==================== Apply CustomData to Group ====================
export async function applyCustomDataToGroup(serverUrl, token, groupId, dataItems, groupPath) {
    if (!serverUrl || !token || !groupPath) {
        throw new Error('Missing required parameters: serverUrl, token, or groupPath');
    }

    if (!dataItems || dataItems.length === 0) {
        throw new Error('No data items to apply');
    }

    let pathForUrl = groupPath || '';
    const encodedPath = encodeURIComponent(pathForUrl);

    console.log(`Applying ${dataItems.length} items to group path: ${pathForUrl}`);

    const staticItems = dataItems.filter(item => {
        if (!item.value || typeof item.value !== 'object') return false;
        return item.value.type === 'static';
    });
    const configItems = dataItems.filter(item =>
        !item.value || !item.value.type || (item.value.type !== 'existing' && item.value.type !== 'static')
    );

    let successCount = 0;
    let errors = [];
    let createdAttributes = [];
    let createdCustomDataDefinitions = [];

    // Ensure CustomData definitions exist for config items
    for (const item of configItems) {
        if (!item.key) continue;
        const result = await ensureCustomDataDefinitionExists(serverUrl, token, item);
        if (result.created) {
            createdCustomDataDefinitions.push(item.key);
            const enableResult = await enableCustomDataOnGroup(serverUrl, token, groupPath, item.key);
            if (!enableResult.success) {
                console.warn(`⚠️ Could not enable "${item.key}" on group: ${enableResult.error}`);
            }
        } else if (result.skipped) {
            console.warn(`⚠️ Skipped CustomData definition for ${item.key}: ${result.warning}`);
        } else if (result.error) {
            errors.push(`Failed to create CustomData definition for ${item.key}: ${result.error}`);
        }
    }

    // Ensure custom attribute definitions exist for static items
    for (const item of staticItems) {
        if (!item.key) continue;
        const result = await ensureCustomAttributeExists(serverUrl, token, item.key, 'Text');
        if (result.created) {
            createdAttributes.push(item.key);
        } else if (result.error) {
            errors.push(`Failed to create attribute definition for ${item.key}: ${result.error}`);
        }
    }

    // Ensure CustomDataConfig attribute exists
    if (configItems.length > 0) {
        const configResult = await ensureCustomAttributeExists(serverUrl, token, 'CustomDataConfig', 'Text');
        if (configResult.created) {
            createdAttributes.push('CustomDataConfig');
        } else if (configResult.error) {
            errors.push(`Failed to create CustomDataConfig attribute: ${configResult.error}`);
        }
    }

    // Disable inheritance on group
    try {
        const groupObj = await sotiApiRequest(serverUrl, token, `/MobiControl/api/devicegroups/${encodedPath}`);

        if (groupObj.AreCustomAttributesInherited !== false) {
            groupObj.AreCustomAttributesInherited = false;

            try {
                await sotiApiRequest(serverUrl, token, `/MobiControl/api/devicegroups/${encodedPath}`, 'PATCH', { AreCustomAttributesInherited: false });
            } catch (patchErr) {
                const groupIdForUpdate = groupObj.ReferenceId || groupObj.referenceId || groupObj.DeviceGroupId || groupObj.Id;
                if (groupIdForUpdate) {
                    try {
                        await sotiApiRequest(serverUrl, token, `/MobiControl/api/devicegroups/${groupIdForUpdate}`, 'PUT', groupObj);
                    } catch (putErr) {
                        console.warn(`⚠️ Failed to disable inheritance: ${putErr.message}`);
                    }
                }
            }
        }
    } catch (inhErr) {
        console.warn('Error checking/disabling inheritance:', inhErr.message);
    }

    // Apply static items individually via PUT
    for (const item of staticItems) {
        if (!item.key || !item.value || typeof item.value !== 'object' || typeof item.value.value === 'undefined') continue;

        const requestBody = JSON.stringify(item.value.value);

        try {
            await sotiApiRequest(serverUrl, token, `/MobiControl/api/devicegroups/${encodedPath}/customAttributes/${encodeURIComponent(item.key)}`, 'PUT', JSON.parse(requestBody));
            successCount++;
        } catch (fetchErr) {
            const errMsg = fetchErr.message.toLowerCase();

            if (fetchErr.message.includes('403')) {
                errors.push(`${item.key}: Permission denied - API user may lack write access`);
            } else if (fetchErr.message.includes('404')) {
                errors.push(`${item.key}: Attribute not found - custom attribute definition may not exist`);
            } else if (fetchErr.message.includes('422') || fetchErr.message.includes('2056') ||
                       errMsg.includes('value type is correct') || errMsg.includes('type is correct')) {
                errors.push(`${item.key}: Type mismatch - "${item.value.value}" is not valid for this attribute's data type`);
            } else if (fetchErr.message.includes('400')) {
                if (errMsg.includes('integer') || errMsg.includes('int32') || errMsg.includes('int64')) {
                    errors.push(`${item.key}: Type mismatch - expected an Integer value`);
                } else if (errMsg.includes('boolean') || errMsg.includes('bool')) {
                    errors.push(`${item.key}: Type mismatch - expected a Boolean (true/false)`);
                } else {
                    errors.push(`${item.key}: Invalid value - "${item.value.value}" is not valid for this attribute`);
                }
            } else {
                errors.push(`${item.key}: ${fetchErr.message}`);
            }
        }
    }

    // Save CustomDataConfig
    if (configItems.length > 0 && successCount === staticItems.length) {
        const configStr = JSON.stringify(configItems);

        try {
            const payload = {
                Name: 'CustomDataConfig',
                Value: configStr
            };
            await sotiApiRequest(serverUrl, token, `/MobiControl/api/devicegroups/${encodedPath}/customAttributes`, 'PUT', payload);
            successCount++;
        } catch (fetchErr) {
            errors.push(`CustomDataConfig: ${fetchErr.message}`);
        }
    }

    if (errors.length > 0) {
        const errorMsg = `Partial failure. Success: ${successCount}/${dataItems.length}, Errors: ${errors.join('; ')}`;
        throw new Error(errorMsg);
    }

    if (successCount === 0 && dataItems.length > 0) {
        throw new Error('Failed to apply any items. Please check your permissions and group path.');
    }

    return { success: true, applied: successCount };
}
