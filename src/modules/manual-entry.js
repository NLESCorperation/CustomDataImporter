// ==================== Manual Entry ====================
import { elements } from './dom.js';
import { showToast } from './toast.js';
import { updateStatusBar, hideStatusBar } from './status-bar.js';
import { addDataItem } from './data-grid.js';

export function initManualEntry() {
    elements.addManualBtn.addEventListener('click', () => {
        try {
            const name = elements.propName.value.trim();
            const type = 'ini'; // Only INI is supported via API
            const dataType = elements.propDataType.value;
            const desc = elements.propDesc.value.trim();

            if (!name) {
                showToast('Please enter a Property Name', 'error');
                return;
            }

            if (!elements.iniFile || !elements.iniSection || !elements.iniValName) {
                throw new Error('INI input elements not found');
            }
            const file = elements.iniFile.value.trim();
            const section = elements.iniSection.value.trim();
            const valName = elements.iniValName.value.trim();

            if (!file || !section || !valName) {
                showToast('Please fill all INI fields', 'error');
                return;
            }

            const itemValue = {
                type,
                file,
                section,
                valName,
                dataType,
                description: desc
            };

            addDataItem(name, itemValue, true);

            // Reset Form
            elements.propName.value = '';
            elements.propDesc.value = '';
            if (elements.iniFile) elements.iniFile.value = '';
            if (elements.iniSection) elements.iniSection.value = '';
            if (elements.iniValName) elements.iniValName.value = '';

            showToast(`Added property: ${name}`, 'success');
            updateStatusBar('Property added successfully', 'success');
            setTimeout(() => hideStatusBar(), 2000);
        } catch (error) {
            console.error('Error adding property:', error);
            showToast(`Error: ${error.message}`, 'error');
            updateStatusBar('Error adding property', 'error');
        }
    });
}
