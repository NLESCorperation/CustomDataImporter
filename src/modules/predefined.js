// ==================== Predefined Data Picker ====================
import { elements } from './dom.js';
import { showToast } from './toast.js';
import { addDataItem } from './data-grid.js';
import { escapeHtml, formatKeyForDisplay } from './utils.js';

const PREDEFINED_INI_FILE = '/sdcard/Download/customdata.ini';

export const PREDEFINED_DATA = {
    DEVICE: ["LastUpdated", "DistanceToAP", "DropEventsToday", "WakeGestureEnabled", "NTPServer", "NfcStatus", "USBConnected", "USBAccessories", "ProcessorCount", "CpuArchitecture", "LowMemoryThreshold"],
    OS: ["SystemUptime", "LastRebootReason", "LastRebootTime", "TimeFormat", "LocaleList", "AutoTimeEnabled", "AutoTimeZone", "CurrentTimeZone", "ActiveKeyboard", "EnabledKeyboards", "BuildFingerprint", "ProcessCount", "LoadAvg1m", "KernelVersion", "AndroidApiLevel", "BootCount", "DeviceLocked", "ScreenOn", "AdbEnabledState", "AlwaysFinishActs"],
    SENSORS: ["CpuTemperature", "InternalTemperature", "ThermalStatus", "CameraCount", "StepCount", "SensorCount", "AmbientLux", "Proximity"],
    RAM: ["RamUseage", "RamTotal", "RamUsageProcent", "JavaHeapUsedMb", "JavaHeapMaxMb", "GcCount"],
    BATTERY: ["BatteryCurrent", "BatteryHealth", "BatteryVoltage", "BatteryTemperature", "BatteryCycleCount", "BatteryStatus", "BatteryPlugType", "DozeMode", "BatterySaverActive", "BatteryOptWhitelisted", "BatteryCapacityMah", "ChargeTimeMin"],
    STORAGE: ["StorageUse", "StorageTotal", "StorageUseProcent", "StorageHealth", "EncryptionType", "AppCacheMb", "SystemFreeMb", "DataFreeMb"],
    GPS: ["MockLocation", "LocationMode", "GpsStatus"],
    NETWORK: ["NetworkConnectionType", "PublicIP", "NetworkSignalStrength", "WifiSSID", "WifiStatus", "WifiBand", "WifiFrequency", "WifiChannel", "WifiStandard", "WifiRssi", "BSSID", "LinkSpeed", "WifiRxLinkSpeed", "WifiTxLinkSpeed", "WifiMaxDhcpRetryCount", "DNS", "GatewayIPv4", "GatewayIPv6", "MacRandomization", "HiddenSSID", "SavedSSIDs", "APN", "LocalIP", "SubnetMask", "VPNActive", "VpnServerAddress", "TetheringHotspot", "TetheringUSB", "TetheringBluetooth", "TetheringEthernet", "PreferredNetworkMode", "PrivateDnsMode", "RoamingStatus", "ActiveVpnApp", "CaptivePortal", "NetworkProxyHttp", "DataSaverMode", "ImsRegistered"],
    SECURITY: ["UsbDebugging", "DeveloperOptions", "UnknownSources", "PlayIntegrityStatus", "BootloaderStatus", "SecureElement", "SelinuxMode", "VerifiedBootState", "RootDetected", "SecurityPatchLevel", "CommonCriteriaMode", "LockScreenComplexity", "BiometricEnrolledCount", "StrongBoxAvailable", "KnoxSdkVersion", "NotificationListeners", "Screenshots"],
    DISPLAY: ["ScreenLockStatus", "FontScale", "ScreenBrightness", "ScreenTimeout", "AutoRotate", "UserRotation", "RefreshRate", "ScreenResolution", "ScreenDensity", "ExternalDisplayConnected", "AnimatorScale", "TransitionScale"],
    APPS: ["PlayServicesVersion", "WebViewVersion", "DefaultLauncher", "OurProcessImportance", "InstalledAppCount", "SystemAppCount", "UserAppCount", "DefaultBrowser", "DefaultSmsApp", "DefaultDialer", "PkgInstallerVer"],
    BLUETOOTH: ["BluetoothPairedDevices", "BluetoothScanMode", "BluetoothState", "BluetoothMacAddress", "BluetoothConnectedDevices", "BluetoothA2dpConnected"],
    CELLULAR: ["CellBand", "CellCarrier", "CellLAC", "CellMCC", "CellMNC", "CellNetType", "CellRadio", "CellRSRP", "CellRSRQ", "CellSignal", "CellSINR", "CellTower", "CellTowerId"],
    VOLUME: ["RingerMode", "MicMuted", "VolumeMusic", "VolumeRing", "VolumeNotification", "VolumeVoiceCall", "VolumeAlarm", "VolumeAccessibility", "HeadsetConnected"],
    PING_CONNECTIONS: ["PingTarget1", "PingTarget2", "PingTarget3", "PingTarget4", "PingTarget5", "PingTarget6", "PingTarget7", "PingTarget8", "PingTarget9", "PingTarget10"],
    MDM: ["MdmEnrolled", "DeviceOwnerSet", "ProfileOwnerSet", "ManagedProfileActive", "AppRestrictionsBundleSize", "DeviceAdminAppsCount", "UserRestrictionsCount", "UserRestrictions", "EnterpriseOwnership", "OrgOwnedManagedProfile", "DpmRoleHolder", "EnrollmentSpecificId", "DelegatedScopeCount", "DelegatedScopes", "OwnerLockScreenInfo", "AppConfigManaged", "AppRestrictionsKeys", "ProvisionFullyManaged", "ProvisionWorkProfile"]
};

const selectedPredefinedItems = new Set();
const collapsedSections = new Set();

function updatePredefinedSelectedCount() {
    const count = selectedPredefinedItems.size;
    if (elements.predefinedSelectedCount) {
        elements.predefinedSelectedCount.textContent = `${count} selected`;
    }
    if (elements.addSelectedPredefinedBtn) {
        elements.addSelectedPredefinedBtn.disabled = count === 0;
    }
}

function bindPredefinedPickerEvents() {
    // Section header click (toggle collapse)
    document.querySelectorAll('.picker-section-header').forEach(header => {
        header.addEventListener('click', (e) => {
            if (e.target.closest('.picker-section-checkbox')) return;

            const section = header.closest('.picker-section');
            const sectionName = section.dataset.section;

            if (collapsedSections.has(sectionName)) {
                collapsedSections.delete(sectionName);
            } else {
                collapsedSections.add(sectionName);
            }
            section.classList.toggle('collapsed');
        });
    });

    // Section checkbox click (select/deselect all in section)
    document.querySelectorAll('.picker-section-checkbox').forEach(checkbox => {
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            const sectionName = checkbox.dataset.section;
            const keys = PREDEFINED_DATA[sectionName] || [];
            const allSelected = keys.every(k => selectedPredefinedItems.has(`${sectionName}:${k}`));

            if (allSelected) {
                keys.forEach(k => selectedPredefinedItems.delete(`${sectionName}:${k}`));
            } else {
                keys.forEach(k => selectedPredefinedItems.add(`${sectionName}:${k}`));
            }
            renderPredefinedPicker(elements.predefinedSearch?.value || '');
        });
    });

    // Individual item click
    document.querySelectorAll('.picker-item').forEach(item => {
        item.addEventListener('click', () => {
            const itemId = item.dataset.item;
            if (selectedPredefinedItems.has(itemId)) {
                selectedPredefinedItems.delete(itemId);
            } else {
                selectedPredefinedItems.add(itemId);
            }
            renderPredefinedPicker(elements.predefinedSearch?.value || '');
        });
    });
}

export function renderPredefinedPicker(searchQuery = '') {
    const container = elements.predefinedPickerContent;
    if (!container) return;

    const lowerQuery = searchQuery.toLowerCase();
    let hasResults = false;

    let html = '';
    for (const [section, keys] of Object.entries(PREDEFINED_DATA)) {
        const filteredKeys = keys.filter(key =>
            lowerQuery === '' ||
            key.toLowerCase().includes(lowerQuery) ||
            section.toLowerCase().includes(lowerQuery)
        );

        if (filteredKeys.length === 0) continue;
        hasResults = true;

        const isCollapsed = collapsedSections.has(section);
        const selectedInSection = filteredKeys.filter(k => selectedPredefinedItems.has(`${section}:${k}`)).length;
        const allSelected = selectedInSection === filteredKeys.length;
        const someSelected = selectedInSection > 0 && !allSelected;

        html += `
            <div class="picker-section ${isCollapsed ? 'collapsed' : ''}" data-section="${section}">
                <div class="picker-section-header">
                    <div class="picker-section-left">
                        <svg class="picker-section-chevron" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                        <div class="picker-section-checkbox ${allSelected ? 'checked' : ''} ${someSelected ? 'partial' : ''}" data-section="${section}">
                            ${allSelected ? '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>' : ''}
                            ${someSelected ? '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14" /></svg>' : ''}
                        </div>
                        <span class="picker-section-name">${formatKeyForDisplay(section)}</span>
                    </div>
                    <span class="picker-section-count">${selectedInSection}/${filteredKeys.length}</span>
                </div>
                <div class="picker-section-content">
                    ${filteredKeys.map(key => {
                        const itemId = `${section}:${key}`;
                        const isSelected = selectedPredefinedItems.has(itemId);
                        return `
                            <div class="picker-item ${isSelected ? 'selected' : ''}" data-item="${itemId}">
                                <div class="picker-item-checkbox">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                    </svg>
                                </div>
                                <span class="picker-item-name">${formatKeyForDisplay(key)}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    if (!hasResults) {
        html = `
            <div class="picker-no-results">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <p>No data points match "${escapeHtml(searchQuery)}"</p>
            </div>
        `;
    }

    container.innerHTML = html;
    updatePredefinedSelectedCount();
    bindPredefinedPickerEvents();
}

export function initPredefined() {
    renderPredefinedPicker();

    // Search
    elements.predefinedSearch?.addEventListener('input', (e) => {
        renderPredefinedPicker(e.target.value);
    });

    // Expand/Collapse all
    elements.expandAllBtn?.addEventListener('click', () => {
        collapsedSections.clear();
        renderPredefinedPicker(elements.predefinedSearch?.value || '');
    });

    elements.collapseAllBtn?.addEventListener('click', () => {
        Object.keys(PREDEFINED_DATA).forEach(section => collapsedSections.add(section));
        renderPredefinedPicker(elements.predefinedSearch?.value || '');
    });

    // Select All / None
    document.getElementById('select-all-predefined-btn')?.addEventListener('click', () => {
        for (const [section, keys] of Object.entries(PREDEFINED_DATA)) {
            keys.forEach(key => selectedPredefinedItems.add(`${section}:${key}`));
        }
        renderPredefinedPicker(elements.predefinedSearch?.value || '');
    });

    document.getElementById('select-none-predefined-btn')?.addEventListener('click', () => {
        selectedPredefinedItems.clear();
        renderPredefinedPicker(elements.predefinedSearch?.value || '');
    });

    // Add selected items
    elements.addSelectedPredefinedBtn?.addEventListener('click', () => {
        if (selectedPredefinedItems.size === 0) {
            showToast('Please select at least one data point', 'error');
            return;
        }

        let addedCount = 0;
        selectedPredefinedItems.forEach(itemId => {
            const [section, key] = itemId.split(':');
            const displayName = formatKeyForDisplay(key);
            const formattedSection = formatKeyForDisplay(section);
            const itemValue = {
                type: 'ini',
                file: PREDEFINED_INI_FILE,
                section: section,
                valName: key,
                dataType: 'STRING',
                description: `${formattedSection} - ${displayName}`,
                _originalKey: key
            };
            addDataItem(displayName, itemValue, true);
            addedCount++;
        });

        showToast(`Added ${addedCount} data point${addedCount > 1 ? 's' : ''} to the list`, 'success');

        selectedPredefinedItems.clear();
        renderPredefinedPicker(elements.predefinedSearch?.value || '');

        // Switch to the List tab
        document.querySelector('.tab[data-tab="list"]')?.click();
    });
}
