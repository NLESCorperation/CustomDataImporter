// ==================== Apply Data ====================
import { state } from './state.js';
import { elements } from './dom.js';
import { showToast } from './toast.js';
import { updateStatusBar, hideStatusBar } from './status-bar.js';
import { applyCustomDataToGroup, getGroupCustomData } from './api.js';
import { renderDataGrid, updateApplyButton } from './data-grid.js';
import { setButtonLoading } from './utils.js';

export function initApply() {
    elements.applyBtn.addEventListener('click', async () => {
        if (!state.isConnected || !state.token || !state.serverUrl) {
            showToast('Not connected to server. Please connect first.', 'error');
            return;
        }

        if (state.dataItems.length === 0) {
            showToast('No data items to apply. Please add items first.', 'error');
            return;
        }

        if (state.selectedGroups.length === 0) {
            showToast('No groups selected. Please select at least one group.', 'error');
            return;
        }

        // Validate data items structure
        const invalidItems = state.dataItems.filter(item => {
            if (!item.key) return true;
            if (!item.value) return true;
            if (typeof item.value !== 'object') return true;
            if (!item.value.type) return true;
            if (item.value.type === 'static' && typeof item.value.value === 'undefined') return true;
            return false;
        });

        if (invalidItems.length > 0) {
            showToast(`Error: ${invalidItems.length} item(s) have invalid structure.`, 'error');
            return;
        }

        const groupsWithoutPaths = state.selectedGroups.filter(g => !g.path || g.path.trim() === '');
        if (groupsWithoutPaths.length > 0) {
            showToast(`Error: ${groupsWithoutPaths.length} group(s) missing path information.`, 'error');
            return;
        }

        try {
            const totalGroups = state.selectedGroups.length;
            let successCount = 0;
            let failCount = 0;
            const failedGroups = [];

            setButtonLoading(elements.applyBtn, true, 'Applying...');

            for (let i = 0; i < totalGroups; i++) {
                const group = state.selectedGroups[i];
                const groupName = group.path || group.name || `Group ${i + 1}`;

                if (!group.path || group.path.trim() === '') {
                    failCount++;
                    failedGroups.push({ name: groupName, error: 'Missing group path' });
                    showToast(`Failed: ${groupName} - Missing group path`, 'error');
                    continue;
                }

                setButtonLoading(elements.applyBtn, true, `Applying ${i + 1}/${totalGroups}...`);
                updateStatusBar(`Applying to group ${i + 1}/${totalGroups}: ${groupName}`, 'info', true);

                try {
                    await applyCustomDataToGroup(state.serverUrl, state.token, group.id, state.dataItems, group.path);

                    // Verify with delay
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    try {
                        const verifyData = await getGroupCustomData(state.serverUrl, state.token, group.path);
                        const appliedAttributes = verifyData.attributes || [];
                        const appliedKeys = state.dataItems
                            .filter(item => item.value && item.value.type === 'static')
                            .map(item => item.key);

                        const foundAttributes = appliedKeys.filter(key =>
                            appliedAttributes.some(attr => attr.name === key && attr.value !== null && attr.value !== undefined)
                        );

                        if (foundAttributes.length < appliedKeys.length) {
                            const missing = appliedKeys.filter(k => !foundAttributes.includes(k));
                            console.warn(`⚠️ Some attributes not found after applying to ${groupName}:`, missing);
                        }
                    } catch (verifyErr) {
                        console.warn(`Could not verify applied data for ${groupName}:`, verifyErr);
                    }

                    successCount++;
                } catch (err) {
                    console.error(`Failed to apply to ${groupName}:`, err);
                    failCount++;
                    failedGroups.push({ name: groupName, error: err.message });
                    showToast(`Failed: ${groupName} - ${err.message}`, 'error');
                }
            }

            if (failCount === 0) {
                updateStatusBar(`Successfully applied ${state.dataItems.length} items to all ${successCount} groups`, 'success');
                showToast(`Applied changes to ${successCount} group${successCount === 1 ? '' : 's'}`, 'success');

                state.dataItems = [];
                renderDataGrid();
            } else {
                updateStatusBar(`Completed with errors. Success: ${successCount}, Failed: ${failCount}`, 'warning');
                showToast(`Finished: ${successCount} succeeded, ${failCount} failed`, 'warning');
            }

            setTimeout(() => hideStatusBar(), 5000);

        } catch (error) {
            console.error('Critical apply error:', error);
            updateStatusBar('Critical error during apply operation', 'error');
            showToast(`System error: ${error.message}`, 'error');
            setTimeout(() => hideStatusBar(), 5000);
        } finally {
            setButtonLoading(elements.applyBtn, false);
            updateApplyButton();
        }
    });
}
