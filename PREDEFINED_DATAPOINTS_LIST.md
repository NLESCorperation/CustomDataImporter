# Predefined Datapoints Reference

This document is generated from `../CustomDataManager/app/src/main/java/customdatamanager/soti/mobicontrol/data/ProviderRegistry.kt` and the XSight picker in `src/modules/xsight.js`.

Run `npm run sync:datapoints` after CustomDataManager adds, removes, or renames providers.

## Important Notes

When adding these datapoints to SOTI MobiControl via the API:
- **Name (Technical Identifier)**: Cannot be changed - this is the `key` field used in the API.
- **Title/Description**: Can be customized - this is the `description` field sent to the API.
- **Technical Configuration**: Cannot be changed - includes file path, section name, value name, data type, and expression.

## Standard Predefined Datapoints

**INI File:** `/sdcard/Download/customdata.ini`
**Data Type:** STRING

### DEVICE Section
| Key | Current Title/Description | Section | Value Name |
|-----|---------------------------|---------|------------|
| LastUpdated | DEVICE - LastUpdated | DEVICE | LastUpdated |
| DistanceToAP | DEVICE - DistanceToAP | DEVICE | DistanceToAP |
| DropEventsToday | DEVICE - DropEventsToday | DEVICE | DropEventsToday |
| WakeGestureEnabled | DEVICE - WakeGestureEnabled | DEVICE | WakeGestureEnabled |
| NTPServer | DEVICE - NTPServer | DEVICE | NTPServer |
| NfcStatus | DEVICE - NfcStatus | DEVICE | NfcStatus |
| USBConnected | DEVICE - USBConnected | DEVICE | USBConnected |
| USBAccessories | DEVICE - USBAccessories | DEVICE | USBAccessories |
| ProcessorCount | DEVICE - ProcessorCount | DEVICE | ProcessorCount |
| CpuArchitecture | DEVICE - CpuArchitecture | DEVICE | CpuArchitecture |
| LowMemoryThreshold | DEVICE - LowMemoryThreshold | DEVICE | LowMemoryThreshold |

### OS Section
| Key | Current Title/Description | Section | Value Name |
|-----|---------------------------|---------|------------|
| SystemUptime | OS - SystemUptime | OS | SystemUptime |
| LastRebootReason | OS - LastRebootReason | OS | LastRebootReason |
| LastRebootTime | OS - LastRebootTime | OS | LastRebootTime |
| TimeFormat | OS - TimeFormat | OS | TimeFormat |
| LocaleList | OS - LocaleList | OS | LocaleList |
| AutoTimeEnabled | OS - AutoTimeEnabled | OS | AutoTimeEnabled |
| AutoTimeZone | OS - AutoTimeZone | OS | AutoTimeZone |
| CurrentTimeZone | OS - CurrentTimeZone | OS | CurrentTimeZone |
| ActiveKeyboard | OS - ActiveKeyboard | OS | ActiveKeyboard |
| EnabledKeyboards | OS - EnabledKeyboards | OS | EnabledKeyboards |
| BuildFingerprint | OS - BuildFingerprint | OS | BuildFingerprint |
| ProcessCount | OS - ProcessCount | OS | ProcessCount |
| LoadAvg1m | OS - LoadAvg1m | OS | LoadAvg1m |
| KernelVersion | OS - KernelVersion | OS | KernelVersion |
| AndroidApiLevel | OS - AndroidApiLevel | OS | AndroidApiLevel |
| BootCount | OS - BootCount | OS | BootCount |
| DeviceLocked | OS - DeviceLocked | OS | DeviceLocked |
| ScreenOn | OS - ScreenOn | OS | ScreenOn |
| AdbEnabledState | OS - AdbEnabledState | OS | AdbEnabledState |
| AlwaysFinishActs | OS - AlwaysFinishActs | OS | AlwaysFinishActs |

### SENSORS Section
| Key | Current Title/Description | Section | Value Name |
|-----|---------------------------|---------|------------|
| CpuTemperature | SENSORS - CpuTemperature | SENSORS | CpuTemperature |
| InternalTemperature | SENSORS - InternalTemperature | SENSORS | InternalTemperature |
| ThermalStatus | SENSORS - ThermalStatus | SENSORS | ThermalStatus |
| CameraCount | SENSORS - CameraCount | SENSORS | CameraCount |
| StepCount | SENSORS - StepCount | SENSORS | StepCount |
| SensorCount | SENSORS - SensorCount | SENSORS | SensorCount |
| AmbientLux | SENSORS - AmbientLux | SENSORS | AmbientLux |
| Proximity | SENSORS - Proximity | SENSORS | Proximity |

### RAM Section
| Key | Current Title/Description | Section | Value Name |
|-----|---------------------------|---------|------------|
| RamUseage | RAM - RamUseage | RAM | RamUseage |
| RamTotal | RAM - RamTotal | RAM | RamTotal |
| RamUsageProcent | RAM - RamUsageProcent | RAM | RamUsageProcent |
| JavaHeapUsedMb | RAM - JavaHeapUsedMb | RAM | JavaHeapUsedMb |
| JavaHeapMaxMb | RAM - JavaHeapMaxMb | RAM | JavaHeapMaxMb |
| GcCount | RAM - GcCount | RAM | GcCount |

### BATTERY Section
| Key | Current Title/Description | Section | Value Name |
|-----|---------------------------|---------|------------|
| BatteryCurrent | BATTERY - BatteryCurrent | BATTERY | BatteryCurrent |
| BatteryHealth | BATTERY - BatteryHealth | BATTERY | BatteryHealth |
| BatteryVoltage | BATTERY - BatteryVoltage | BATTERY | BatteryVoltage |
| BatteryTemperature | BATTERY - BatteryTemperature | BATTERY | BatteryTemperature |
| BatteryCycleCount | BATTERY - BatteryCycleCount | BATTERY | BatteryCycleCount |
| BatteryStatus | BATTERY - BatteryStatus | BATTERY | BatteryStatus |
| BatteryPlugType | BATTERY - BatteryPlugType | BATTERY | BatteryPlugType |
| DozeMode | BATTERY - DozeMode | BATTERY | DozeMode |
| BatterySaverActive | BATTERY - BatterySaverActive | BATTERY | BatterySaverActive |
| BatteryOptWhitelisted | BATTERY - BatteryOptWhitelisted | BATTERY | BatteryOptWhitelisted |
| BatteryCapacityMah | BATTERY - BatteryCapacityMah | BATTERY | BatteryCapacityMah |
| ChargeTimeMin | BATTERY - ChargeTimeMin | BATTERY | ChargeTimeMin |

### STORAGE Section
| Key | Current Title/Description | Section | Value Name |
|-----|---------------------------|---------|------------|
| StorageUse | STORAGE - StorageUse | STORAGE | StorageUse |
| StorageTotal | STORAGE - StorageTotal | STORAGE | StorageTotal |
| StorageUseProcent | STORAGE - StorageUseProcent | STORAGE | StorageUseProcent |
| StorageHealth | STORAGE - StorageHealth | STORAGE | StorageHealth |
| EncryptionType | STORAGE - EncryptionType | STORAGE | EncryptionType |
| AppCacheMb | STORAGE - AppCacheMb | STORAGE | AppCacheMb |
| SystemFreeMb | STORAGE - SystemFreeMb | STORAGE | SystemFreeMb |
| DataFreeMb | STORAGE - DataFreeMb | STORAGE | DataFreeMb |

### GPS Section
| Key | Current Title/Description | Section | Value Name |
|-----|---------------------------|---------|------------|
| MockLocation | GPS - MockLocation | GPS | MockLocation |
| LocationMode | GPS - LocationMode | GPS | LocationMode |
| GpsStatus | GPS - GpsStatus | GPS | GpsStatus |

### NETWORK Section
| Key | Current Title/Description | Section | Value Name |
|-----|---------------------------|---------|------------|
| NetworkConnectionType | NETWORK - NetworkConnectionType | NETWORK | NetworkConnectionType |
| PublicIP | NETWORK - PublicIP | NETWORK | PublicIP |
| NetworkSignalStrength | NETWORK - NetworkSignalStrength | NETWORK | NetworkSignalStrength |
| WifiSSID | NETWORK - WifiSSID | NETWORK | WifiSSID |
| WifiStatus | NETWORK - WifiStatus | NETWORK | WifiStatus |
| WifiBand | NETWORK - WifiBand | NETWORK | WifiBand |
| WifiFrequency | NETWORK - WifiFrequency | NETWORK | WifiFrequency |
| WifiChannel | NETWORK - WifiChannel | NETWORK | WifiChannel |
| WifiStandard | NETWORK - WifiStandard | NETWORK | WifiStandard |
| WifiRssi | NETWORK - WifiRssi | NETWORK | WifiRssi |
| BSSID | NETWORK - BSSID | NETWORK | BSSID |
| LinkSpeed | NETWORK - LinkSpeed | NETWORK | LinkSpeed |
| WifiRxLinkSpeed | NETWORK - WifiRxLinkSpeed | NETWORK | WifiRxLinkSpeed |
| WifiTxLinkSpeed | NETWORK - WifiTxLinkSpeed | NETWORK | WifiTxLinkSpeed |
| WifiMaxDhcpRetryCount | NETWORK - WifiMaxDhcpRetryCount | NETWORK | WifiMaxDhcpRetryCount |
| DNS | NETWORK - DNS | NETWORK | DNS |
| GatewayIPv4 | NETWORK - GatewayIPv4 | NETWORK | GatewayIPv4 |
| GatewayIPv6 | NETWORK - GatewayIPv6 | NETWORK | GatewayIPv6 |
| MacRandomization | NETWORK - MacRandomization | NETWORK | MacRandomization |
| HiddenSSID | NETWORK - HiddenSSID | NETWORK | HiddenSSID |
| SavedSSIDs | NETWORK - SavedSSIDs | NETWORK | SavedSSIDs |
| APN | NETWORK - APN | NETWORK | APN |
| LocalIP | NETWORK - LocalIP | NETWORK | LocalIP |
| SubnetMask | NETWORK - SubnetMask | NETWORK | SubnetMask |
| VPNActive | NETWORK - VPNActive | NETWORK | VPNActive |
| VpnServerAddress | NETWORK - VpnServerAddress | NETWORK | VpnServerAddress |
| TetheringHotspot | NETWORK - TetheringHotspot | NETWORK | TetheringHotspot |
| TetheringUSB | NETWORK - TetheringUSB | NETWORK | TetheringUSB |
| TetheringBluetooth | NETWORK - TetheringBluetooth | NETWORK | TetheringBluetooth |
| TetheringEthernet | NETWORK - TetheringEthernet | NETWORK | TetheringEthernet |
| PreferredNetworkMode | NETWORK - PreferredNetworkMode | NETWORK | PreferredNetworkMode |
| PrivateDnsMode | NETWORK - PrivateDnsMode | NETWORK | PrivateDnsMode |
| RoamingStatus | NETWORK - RoamingStatus | NETWORK | RoamingStatus |
| ActiveVpnApp | NETWORK - ActiveVpnApp | NETWORK | ActiveVpnApp |
| CaptivePortal | NETWORK - CaptivePortal | NETWORK | CaptivePortal |
| NetworkProxyHttp | NETWORK - NetworkProxyHttp | NETWORK | NetworkProxyHttp |
| DataSaverMode | NETWORK - DataSaverMode | NETWORK | DataSaverMode |
| ImsRegistered | NETWORK - ImsRegistered | NETWORK | ImsRegistered |

### SECURITY Section
| Key | Current Title/Description | Section | Value Name |
|-----|---------------------------|---------|------------|
| UsbDebugging | SECURITY - UsbDebugging | SECURITY | UsbDebugging |
| DeveloperOptions | SECURITY - DeveloperOptions | SECURITY | DeveloperOptions |
| UnknownSources | SECURITY - UnknownSources | SECURITY | UnknownSources |
| PlayIntegrityStatus | SECURITY - PlayIntegrityStatus | SECURITY | PlayIntegrityStatus |
| BootloaderStatus | SECURITY - BootloaderStatus | SECURITY | BootloaderStatus |
| SecureElement | SECURITY - SecureElement | SECURITY | SecureElement |
| SelinuxMode | SECURITY - SelinuxMode | SECURITY | SelinuxMode |
| VerifiedBootState | SECURITY - VerifiedBootState | SECURITY | VerifiedBootState |
| RootDetected | SECURITY - RootDetected | SECURITY | RootDetected |
| SecurityPatchLevel | SECURITY - SecurityPatchLevel | SECURITY | SecurityPatchLevel |
| CommonCriteriaMode | SECURITY - CommonCriteriaMode | SECURITY | CommonCriteriaMode |
| LockScreenComplexity | SECURITY - LockScreenComplexity | SECURITY | LockScreenComplexity |
| BiometricEnrolledCount | SECURITY - BiometricEnrolledCount | SECURITY | BiometricEnrolledCount |
| StrongBoxAvailable | SECURITY - StrongBoxAvailable | SECURITY | StrongBoxAvailable |
| KnoxSdkVersion | SECURITY - KnoxSdkVersion | SECURITY | KnoxSdkVersion |
| NotificationListeners | SECURITY - NotificationListeners | SECURITY | NotificationListeners |
| Screenshots | SECURITY - Screenshots | SECURITY | Screenshots |

### DISPLAY Section
| Key | Current Title/Description | Section | Value Name |
|-----|---------------------------|---------|------------|
| ScreenLockStatus | DISPLAY - ScreenLockStatus | DISPLAY | ScreenLockStatus |
| FontScale | DISPLAY - FontScale | DISPLAY | FontScale |
| ScreenBrightness | DISPLAY - ScreenBrightness | DISPLAY | ScreenBrightness |
| ScreenTimeout | DISPLAY - ScreenTimeout | DISPLAY | ScreenTimeout |
| AutoRotate | DISPLAY - AutoRotate | DISPLAY | AutoRotate |
| UserRotation | DISPLAY - UserRotation | DISPLAY | UserRotation |
| RefreshRate | DISPLAY - RefreshRate | DISPLAY | RefreshRate |
| ScreenResolution | DISPLAY - ScreenResolution | DISPLAY | ScreenResolution |
| ScreenDensity | DISPLAY - ScreenDensity | DISPLAY | ScreenDensity |
| ExternalDisplayConnected | DISPLAY - ExternalDisplayConnected | DISPLAY | ExternalDisplayConnected |
| AnimatorScale | DISPLAY - AnimatorScale | DISPLAY | AnimatorScale |
| TransitionScale | DISPLAY - TransitionScale | DISPLAY | TransitionScale |

### APPS Section
| Key | Current Title/Description | Section | Value Name |
|-----|---------------------------|---------|------------|
| PlayServicesVersion | APPS - PlayServicesVersion | APPS | PlayServicesVersion |
| WebViewVersion | APPS - WebViewVersion | APPS | WebViewVersion |
| DefaultLauncher | APPS - DefaultLauncher | APPS | DefaultLauncher |
| OurProcessImportance | APPS - OurProcessImportance | APPS | OurProcessImportance |
| InstalledAppCount | APPS - InstalledAppCount | APPS | InstalledAppCount |
| SystemAppCount | APPS - SystemAppCount | APPS | SystemAppCount |
| UserAppCount | APPS - UserAppCount | APPS | UserAppCount |
| DefaultBrowser | APPS - DefaultBrowser | APPS | DefaultBrowser |
| DefaultSmsApp | APPS - DefaultSmsApp | APPS | DefaultSmsApp |
| DefaultDialer | APPS - DefaultDialer | APPS | DefaultDialer |
| PkgInstallerVer | APPS - PkgInstallerVer | APPS | PkgInstallerVer |

### BLUETOOTH Section
| Key | Current Title/Description | Section | Value Name |
|-----|---------------------------|---------|------------|
| BluetoothPairedDevices | BLUETOOTH - BluetoothPairedDevices | BLUETOOTH | BluetoothPairedDevices |
| BluetoothScanMode | BLUETOOTH - BluetoothScanMode | BLUETOOTH | BluetoothScanMode |
| BluetoothState | BLUETOOTH - BluetoothState | BLUETOOTH | BluetoothState |
| BluetoothMacAddress | BLUETOOTH - BluetoothMacAddress | BLUETOOTH | BluetoothMacAddress |
| BluetoothConnectedDevices | BLUETOOTH - BluetoothConnectedDevices | BLUETOOTH | BluetoothConnectedDevices |
| BluetoothA2dpConnected | BLUETOOTH - BluetoothA2dpConnected | BLUETOOTH | BluetoothA2dpConnected |

### CELLULAR Section
| Key | Current Title/Description | Section | Value Name |
|-----|---------------------------|---------|------------|
| CellBand | CELLULAR - CellBand | CELLULAR | CellBand |
| CellCarrier | CELLULAR - CellCarrier | CELLULAR | CellCarrier |
| CellLAC | CELLULAR - CellLAC | CELLULAR | CellLAC |
| CellMCC | CELLULAR - CellMCC | CELLULAR | CellMCC |
| CellMNC | CELLULAR - CellMNC | CELLULAR | CellMNC |
| CellNetType | CELLULAR - CellNetType | CELLULAR | CellNetType |
| CellRadio | CELLULAR - CellRadio | CELLULAR | CellRadio |
| CellRSRP | CELLULAR - CellRSRP | CELLULAR | CellRSRP |
| CellRSRQ | CELLULAR - CellRSRQ | CELLULAR | CellRSRQ |
| CellSignal | CELLULAR - CellSignal | CELLULAR | CellSignal |
| CellSINR | CELLULAR - CellSINR | CELLULAR | CellSINR |
| CellTower | CELLULAR - CellTower | CELLULAR | CellTower |
| CellTowerId | CELLULAR - CellTowerId | CELLULAR | CellTowerId |

### VOLUME Section
| Key | Current Title/Description | Section | Value Name |
|-----|---------------------------|---------|------------|
| RingerMode | VOLUME - RingerMode | VOLUME | RingerMode |
| MicMuted | VOLUME - MicMuted | VOLUME | MicMuted |
| VolumeMusic | VOLUME - VolumeMusic | VOLUME | VolumeMusic |
| VolumeRing | VOLUME - VolumeRing | VOLUME | VolumeRing |
| VolumeNotification | VOLUME - VolumeNotification | VOLUME | VolumeNotification |
| VolumeVoiceCall | VOLUME - VolumeVoiceCall | VOLUME | VolumeVoiceCall |
| VolumeAlarm | VOLUME - VolumeAlarm | VOLUME | VolumeAlarm |
| VolumeAccessibility | VOLUME - VolumeAccessibility | VOLUME | VolumeAccessibility |
| HeadsetConnected | VOLUME - HeadsetConnected | VOLUME | HeadsetConnected |

### PING_CONNECTIONS Section
| Key | Current Title/Description | Section | Value Name |
|-----|---------------------------|---------|------------|
| PingTarget1 | PING_CONNECTIONS - PingTarget1 | PING_CONNECTIONS | PingTarget1 |
| PingTarget2 | PING_CONNECTIONS - PingTarget2 | PING_CONNECTIONS | PingTarget2 |
| PingTarget3 | PING_CONNECTIONS - PingTarget3 | PING_CONNECTIONS | PingTarget3 |
| PingTarget4 | PING_CONNECTIONS - PingTarget4 | PING_CONNECTIONS | PingTarget4 |
| PingTarget5 | PING_CONNECTIONS - PingTarget5 | PING_CONNECTIONS | PingTarget5 |
| PingTarget6 | PING_CONNECTIONS - PingTarget6 | PING_CONNECTIONS | PingTarget6 |
| PingTarget7 | PING_CONNECTIONS - PingTarget7 | PING_CONNECTIONS | PingTarget7 |
| PingTarget8 | PING_CONNECTIONS - PingTarget8 | PING_CONNECTIONS | PingTarget8 |
| PingTarget9 | PING_CONNECTIONS - PingTarget9 | PING_CONNECTIONS | PingTarget9 |
| PingTarget10 | PING_CONNECTIONS - PingTarget10 | PING_CONNECTIONS | PingTarget10 |

### MDM Section
| Key | Current Title/Description | Section | Value Name |
|-----|---------------------------|---------|------------|
| MdmEnrolled | MDM - MdmEnrolled | MDM | MdmEnrolled |
| DeviceOwnerSet | MDM - DeviceOwnerSet | MDM | DeviceOwnerSet |
| ProfileOwnerSet | MDM - ProfileOwnerSet | MDM | ProfileOwnerSet |
| ManagedProfileActive | MDM - ManagedProfileActive | MDM | ManagedProfileActive |
| AppRestrictionsBundleSize | MDM - AppRestrictionsBundleSize | MDM | AppRestrictionsBundleSize |
| DeviceAdminAppsCount | MDM - DeviceAdminAppsCount | MDM | DeviceAdminAppsCount |
| UserRestrictionsCount | MDM - UserRestrictionsCount | MDM | UserRestrictionsCount |
| UserRestrictions | MDM - UserRestrictions | MDM | UserRestrictions |
| EnterpriseOwnership | MDM - EnterpriseOwnership | MDM | EnterpriseOwnership |
| OrgOwnedManagedProfile | MDM - OrgOwnedManagedProfile | MDM | OrgOwnedManagedProfile |
| DpmRoleHolder | MDM - DpmRoleHolder | MDM | DpmRoleHolder |
| EnrollmentSpecificId | MDM - EnrollmentSpecificId | MDM | EnrollmentSpecificId |
| DelegatedScopeCount | MDM - DelegatedScopeCount | MDM | DelegatedScopeCount |
| DelegatedScopes | MDM - DelegatedScopes | MDM | DelegatedScopes |
| OwnerLockScreenInfo | MDM - OwnerLockScreenInfo | MDM | OwnerLockScreenInfo |
| AppConfigManaged | MDM - AppConfigManaged | MDM | AppConfigManaged |
| AppRestrictionsKeys | MDM - AppRestrictionsKeys | MDM | AppRestrictionsKeys |
| ProvisionFullyManaged | MDM - ProvisionFullyManaged | MDM | ProvisionFullyManaged |
| ProvisionWorkProfile | MDM - ProvisionWorkProfile | MDM | ProvisionWorkProfile |

## XSight Agent Datapoints

**INI File:** `/sdcard/Download/XSightReport_AllJson.ini`
**Data Type:** STRING

| Key | Display Name | Current Title/Description | Section | Value Name |
|-----|--------------|---------------------------|---------|------------|
| mcAgentVersion | MC Agent Version | XSight Agent - MC Agent Version | Status | mcAgentVersion |
| osVersion | OS Version | XSight Agent - OS Version | Status | osVersion |
| activeCollectors | XSight Active Collectors | XSight Agent - XSight Active Collectors | Status | activeCollectors |
| activeCookers | XSight Active Cookers | XSight Agent - XSight Active Cookers | Status | activeCookers |
| activeLiveview | XSight Active Liveview | XSight Agent - XSight Active Liveview | Status | activeLiveview |
| agentVersion | XSight Agent Version | XSight Agent - XSight Agent Version | Status | agentVersion |
| batteryCapacity | XSight Battery Capacity | XSight Agent - XSight Battery Capacity | Status | batteryCapacity |
| configuration.collectPeriod | XSight Configuration Collect Period | XSight Agent - XSight Configuration Collect Period | configuration | collectPeriod |
| configuration.configurations | XSight Configuration Configurations | XSight Agent - XSight Configuration Configurations | configuration | configurations |
| configuration.cookFrom | XSight Configuration Cook From | XSight Agent - XSight Configuration Cook From | configuration | cookFrom |
| configuration.cookPeriod | XSight Configuration Cook Period | XSight Agent - XSight Configuration Cook Period | configuration | cookPeriod |
| configuration.delivery | XSight Configuration Delivery | XSight Agent - XSight Configuration Delivery | configuration | delivery |
| configuration.deliveryWindowLength | XSight Configuration Delivery Window Length | XSight Agent - XSight Configuration Delivery Window Length | configuration | deliveryWindowLength |
| configuration.lastCollection | XSight Configuration Last Collection | XSight Agent - XSight Configuration Last Collection | configuration | lastCollection |
| configuration.nextCollection | XSight Configuration Next Collection | XSight Agent - XSight Configuration Next Collection | configuration | nextCollection |
| configuration.oldAppPreferences | XSight Configuration Old App Preferences | XSight Agent - XSight Configuration Old App Preferences | configuration | oldAppPreferences |
| configuration.profileName | XSight Configuration Profile Name | XSight Agent - XSight Configuration Profile Name | configuration | profileName |
| connection | XSight Connection | XSight Agent - XSight Connection | Status | connection |
| lastCookStatus | XSight Cook Status | XSight Agent - XSight Cook Status | Status | lastCookStatus |
| databaseSize | XSight Database Size | XSight Agent - XSight Database Size | Status | databaseSize |
| deviceId | XSight Device ID | XSight Agent - XSight Device ID | Status | deviceId |
| keepRawData | XSight Keep Raw Data | XSight Agent - XSight Keep Raw Data | Status | keepRawData |
| lastUpload | XSight Last Upload | XSight Agent - XSight Last Upload | Status | lastUpload |
| liveSupport.authState | XSight Live Support Auth State | XSight Agent - XSight Live Support Auth State | liveSupport | authState |
| liveSupport.installState | XSight Live Support Install State | XSight Agent - XSight Live Support Install State | liveSupport | installState |
| liveSupport.networkState | XSight Live Support Network State | XSight Agent - XSight Live Support Network State | liveSupport | networkState |
| liveSupport.serviceBoundState | XSight Live Support Service Bound State | XSight Agent - XSight Live Support Service Bound State | liveSupport | serviceBoundState |
| liveSupport.trustState | XSight Live Support Trust State | XSight Agent - XSight Live Support Trust State | liveSupport | trustState |
| liveSupport.webSocketState | XSight Live Support Web Socket State | XSight Agent - XSight Live Support Web Socket State | liveSupport | webSocketState |
| nextUpload | XSight Next Upload | XSight Agent - XSight Next Upload | Status | nextUpload |
| serverAddress | XSight Server Address | XSight Agent - XSight Server Address | Status | serverAddress |
| smartSocketStatus | XSight Smart Socket Status | XSight Agent - XSight Smart Socket Status | Status | smartSocketStatus |
| smartSocketVersion | XSight Smart Socket Version | XSight Agent - XSight Smart Socket Version | Status | smartSocketVersion |

## Summary Statistics

- **Total Standard Predefined Datapoints:** 203
- **Total XSight Agent Datapoints:** 33
- **Total Datapoints:** 236

### Breakdown by Section (Standard Datapoints)
- DEVICE: 11
- OS: 20
- SENSORS: 8
- RAM: 6
- BATTERY: 12
- STORAGE: 8
- GPS: 3
- NETWORK: 38
- SECURITY: 17
- DISPLAY: 12
- APPS: 11
- BLUETOOTH: 6
- CELLULAR: 13
- VOLUME: 9
- PING_CONNECTIONS: 10
- MDM: 19

## API Implementation Details

When a datapoint is added to SOTI MobiControl, the API request structure is:

```json
{
  "Name": "<key>",
  "Description": "<customizable-title>",
  "PhysicalType": "String",
  "DeviceFamily": "AndroidPlus",
  "DeviceKinds": ["AndroidPlus", "AndroidElm", "AndroidForWork", "AndroidKnox"],
  "Enabled": true,
  "Expression": "INI://<file>?SC=<section>&NM=<valName>"
}
```

Only the `Description` field (shown as "Title" in the UI) can be customized when adding datapoints to SOTI MobiControl.
