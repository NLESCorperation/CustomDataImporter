# Predefined Datapoints Reference

This document lists all predefined datapoints available in the Custom Data Importer, including standard predefined datapoints and XSight Agent datapoints.

## Important Notes

When adding these datapoints to SOTI MobiControl via the API:
- **Name (Technical Identifier)**: Cannot be changed - this is the `key` field used in the API
- **Title/Description**: Can be customized - this is the `description` field sent to the API
- **Technical Configuration**: Cannot be changed - includes:
  - File path (`file`)
  - Section name (`section`)
  - Value name (`valName`)
  - Data type (`dataType` - always STRING)
  - Expression (built from the above fields)

---

## Standard Predefined Datapoints

**INI File:** `/sdcard/Download/customdata.ini`
**Data Type:** STRING

### APPS Section
| Key | Current Title/Description | Section | Value Name |
|-----|---------------------------|---------|------------|
| Default Launcher | APPS - DefaultLauncher | APPS | DefaultLauncher |
| Play Services Version | APPS - PlayServicesVersion | APPS | PlayServicesVersion |
| WebView Version | APPS - WebViewVersion | APPS | WebViewVersion |

### BATTERY Section
| Key | Current Title/Description | Section | Value Name |
|-----|---------------------------|---------|------------|
| Battery Current | BATTERY - BatteryCurrent | BATTERY | BatteryCurrent |
| Battery CycleCount | BATTERY - BatteryCycleCount | BATTERY | BatteryCycleCount |
| Battery Health | BATTERY - BatteryHealth | BATTERY | BatteryHealth |
| BatteryP lugType | BATTERY - BatteryPlugType | BATTERY | BatteryPlugType |
| Battery Status | BATTERY - BatteryStatus | BATTERY | BatteryStatus |
| Battery Temperature | BATTERY - BatteryTemperature | BATTERY | BatteryTemperature |
| Battery Voltage | BATTERY - BatteryVoltage | BATTERY | BatteryVoltage |

### BLUETOOTH Section
| Key | Current Title/Description | Section | Value Name |
|-----|---------------------------|---------|------------|
| Bluetooth Connected Devices | BLUETOOTH - BluetoothConnectedDevices | BLUETOOTH | BluetoothConnectedDevices |
| BluetoothMacAddress | BLUETOOTH - BluetoothMacAddress | BLUETOOTH | BluetoothMacAddress |
| BluetoothPairedDevices | BLUETOOTH - BluetoothPairedDevices | BLUETOOTH | BluetoothPairedDevices |
| BluetoothScanMode | BLUETOOTH - BluetoothScanMode | BLUETOOTH | BluetoothScanMode |
| BluetoothState | BLUETOOTH - BluetoothState | BLUETOOTH | BluetoothState |

### CELLULAR Section
| Key | Current Title/Description | Section | Value Name |
|-----|---------------------------|---------|------------|
| CellBand | CELLULAR - CellBand | CELLULAR | CellBand |
| CellCarrier | CELLULAR - CellCarrier | CELLULAR | CellCarrier |
| CellLAC | CELLULAR - CellLAC | CELLULAR | CellLAC |
| CellMCC | CELLULAR - CellMCC | CELLULAR | CellMCC |
| CellMNC | CELLULAR - CellMNC | CELLULAR | CellMNC |
| CellNetType | CELLULAR - CellNetType | CELLULAR | CellNetType |
| CellRSRP | CELLULAR - CellRSRP | CELLULAR | CellRSRP |
| CellRSRQ | CELLULAR - CellRSRQ | CELLULAR | CellRSRQ |
| CellRadio | CELLULAR - CellRadio | CELLULAR | CellRadio |
| CellSINR | CELLULAR - CellSINR | CELLULAR | CellSINR |
| CellSignal | CELLULAR - CellSignal | CELLULAR | CellSignal |
| CellTower | CELLULAR - CellTower | CELLULAR | CellTower |
| CellTowerId | CELLULAR - CellTowerId | CELLULAR | CellTowerId |

### DEVICE Section
| Key | Current Title/Description | Section | Value Name |
|-----|---------------------------|---------|------------|
| CpuArchitecture | DEVICE - CpuArchitecture | DEVICE | CpuArchitecture |
| DistanceToAP | DEVICE - DistanceToAP | DEVICE | DistanceToAP |
| DropEventsToday | DEVICE - DropEventsToday | DEVICE | DropEventsToday |
| LastUpdated | DEVICE - LastUpdated | DEVICE | LastUpdated |
| LowMemoryThreshold | DEVICE - LowMemoryThreshold | DEVICE | LowMemoryThreshold |
| NTPServer | DEVICE - NTPServer | DEVICE | NTPServer |
| NfcStatus | DEVICE - NfcStatus | DEVICE | NfcStatus |
| ProcessorCount | DEVICE - ProcessorCount | DEVICE | ProcessorCount |
| USBAccessories | DEVICE - USBAccessories | DEVICE | USBAccessories |
| USBConnected | DEVICE - USBConnected | DEVICE | USBConnected |
| WakeGestureEnabled | DEVICE - WakeGestureEnabled | DEVICE | WakeGestureEnabled |

### DISPLAY Section
| Key | Current Title/Description | Section | Value Name |
|-----|---------------------------|---------|------------|
| AutoRotate | DISPLAY - AutoRotate | DISPLAY | AutoRotate |
| FontScale | DISPLAY - FontScale | DISPLAY | FontScale |
| RefreshRate | DISPLAY - RefreshRate | DISPLAY | RefreshRate |
| ScreenBrightness | DISPLAY - ScreenBrightness | DISPLAY | ScreenBrightness |
| ScreenDensity | DISPLAY - ScreenDensity | DISPLAY | ScreenDensity |
| ScreenLockStatus | DISPLAY - ScreenLockStatus | DISPLAY | ScreenLockStatus |
| ScreenResolution | DISPLAY - ScreenResolution | DISPLAY | ScreenResolution |
| ScreenTimeout | DISPLAY - ScreenTimeout | DISPLAY | ScreenTimeout |
| UserRotation | DISPLAY - UserRotation | DISPLAY | UserRotation |

### GPS Section
| Key | Current Title/Description | Section | Value Name |
|-----|---------------------------|---------|------------|
| GpsStatus | GPS - GpsStatus | GPS | GpsStatus |
| LocationMode | GPS - LocationMode | GPS | LocationMode |
| MockLocation | GPS - MockLocation | GPS | MockLocation |

### NETWORK Section
| Key | Current Title/Description | Section | Value Name |
|-----|---------------------------|---------|------------|
| APN | NETWORK - APN | NETWORK | APN |
| BSSID | NETWORK - BSSID | NETWORK | BSSID |
| DNS | NETWORK - DNS | NETWORK | DNS |
| GatewayIPv4 | NETWORK - GatewayIPv4 | NETWORK | GatewayIPv4 |
| GatewayIPv6 | NETWORK - GatewayIPv6 | NETWORK | GatewayIPv6 |
| HiddenSSID | NETWORK - HiddenSSID | NETWORK | HiddenSSID |
| LinkSpeed | NETWORK - LinkSpeed | NETWORK | LinkSpeed |
| LocalIP | NETWORK - LocalIP | NETWORK | LocalIP |
| MacRandomization | NETWORK - MacRandomization | NETWORK | MacRandomization |
| NetworkConnectionType | NETWORK - NetworkConnectionType | NETWORK | NetworkConnectionType |
| NetworkSignalStrength | NETWORK - NetworkSignalStrength | NETWORK | NetworkSignalStrength |
| PreferredNetworkMode | NETWORK - PreferredNetworkMode | NETWORK | PreferredNetworkMode |
| PrivateDnsMode | NETWORK - PrivateDnsMode | NETWORK | PrivateDnsMode |
| PublicIP | NETWORK - PublicIP | NETWORK | PublicIP |
| RoamingStatus | NETWORK - RoamingStatus | NETWORK | RoamingStatus |
| SavedSSIDs | NETWORK - SavedSSIDs | NETWORK | SavedSSIDs |
| SubnetMask | NETWORK - SubnetMask | NETWORK | SubnetMask |
| TetheringBluetooth | NETWORK - TetheringBluetooth | NETWORK | TetheringBluetooth |
| TetheringEthernet | NETWORK - TetheringEthernet | NETWORK | TetheringEthernet |
| TetheringHotspot | NETWORK - TetheringHotspot | NETWORK | TetheringHotspot |
| TetheringUSB | NETWORK - TetheringUSB | NETWORK | TetheringUSB |
| VPNActive | NETWORK - VPNActive | NETWORK | VPNActive |
| VpnServerAddress | NETWORK - VpnServerAddress | NETWORK | VpnServerAddress |
| WifiBand | NETWORK - WifiBand | NETWORK | WifiBand |
| WifiChannel | NETWORK - WifiChannel | NETWORK | WifiChannel |
| WifiFrequency | NETWORK - WifiFrequency | NETWORK | WifiFrequency |
| WifiMaxDhcpRetryCount | NETWORK - WifiMaxDhcpRetryCount | NETWORK | WifiMaxDhcpRetryCount |
| WifiRssi | NETWORK - WifiRssi | NETWORK | WifiRssi |
| WifiRxLinkSpeed | NETWORK - WifiRxLinkSpeed | NETWORK | WifiRxLinkSpeed |
| WifiSSID | NETWORK - WifiSSID | NETWORK | WifiSSID |
| WifiStandard | NETWORK - WifiStandard | NETWORK | WifiStandard |
| WifiStatus | NETWORK - WifiStatus | NETWORK | WifiStatus |
| WifiTxLinkSpeed | NETWORK - WifiTxLinkSpeed | NETWORK | WifiTxLinkSpeed |

### OS Section
| Key | Current Title/Description | Section | Value Name |
|-----|---------------------------|---------|------------|
| ActiveKeyboard | OS - ActiveKeyboard | OS | ActiveKeyboard |
| AutoTimeEnabled | OS - AutoTimeEnabled | OS | AutoTimeEnabled |
| AutoTimeZone | OS - AutoTimeZone | OS | AutoTimeZone |
| BuildFingerprint | OS - BuildFingerprint | OS | BuildFingerprint |
| CurrentTimeZone | OS - CurrentTimeZone | OS | CurrentTimeZone |
| EnabledKeyboards | OS - EnabledKeyboards | OS | EnabledKeyboards |
| LastRebootReason | OS - LastRebootReason | OS | LastRebootReason |
| LastRebootTime | OS - LastRebootTime | OS | LastRebootTime |
| LocaleList | OS - LocaleList | OS | LocaleList |
| SystemUptime | OS - SystemUptime | OS | SystemUptime |
| TimeFormat | OS - TimeFormat | OS | TimeFormat |

### PING_CONNECTIONS Section
| Key | Current Title/Description | Section | Value Name |
|-----|---------------------------|---------|------------|
| PingTarget1 | PING_CONNECTIONS - PingTarget1 | PING_CONNECTIONS | PingTarget1 |
| PingTarget2 | PING_CONNECTIONS - PingTarget2 | PING_CONNECTIONS | PingTarget2 |
| PingTarget3 | PING_CONNECTIONS - PingTarget3 | PING_CONNECTIONS | PingTarget3 |

### RAM Section
| Key | Current Title/Description | Section | Value Name |
|-----|---------------------------|---------|------------|
| RamTotal | RAM - RamTotal | RAM | RamTotal |
| RamUsageProcent | RAM - RamUsageProcent | RAM | RamUsageProcent |
| RamUseage | RAM - RamUseage | RAM | RamUseage |

### SECURITY Section
| Key | Current Title/Description | Section | Value Name |
|-----|---------------------------|---------|------------|
| BootloaderStatus | SECURITY - BootloaderStatus | SECURITY | BootloaderStatus |
| DeveloperOptions | SECURITY - DeveloperOptions | SECURITY | DeveloperOptions |
| PlayIntegrityStatus | SECURITY - PlayIntegrityStatus | SECURITY | PlayIntegrityStatus |
| SecureElement | SECURITY - SecureElement | SECURITY | SecureElement |
| UnknownSources | SECURITY - UnknownSources | SECURITY | UnknownSources |
| UsbDebugging | SECURITY - UsbDebugging | SECURITY | UsbDebugging |

### SENSORS Section
| Key | Current Title/Description | Section | Value Name |
|-----|---------------------------|---------|------------|
| CpuTemperature | SENSORS - CpuTemperature | SENSORS | CpuTemperature |
| InternalTemperature | SENSORS - InternalTemperature | SENSORS | InternalTemperature |
| ThermalStatus | SENSORS - ThermalStatus | SENSORS | ThermalStatus |

### STORAGE Section
| Key | Current Title/Description | Section | Value Name |
|-----|---------------------------|---------|------------|
| EncryptionType | STORAGE - EncryptionType | STORAGE | EncryptionType |
| StorageHealth | STORAGE - StorageHealth | STORAGE | StorageHealth |
| StorageTotal | STORAGE - StorageTotal | STORAGE | StorageTotal |
| StorageUse | STORAGE - StorageUse | STORAGE | StorageUse |
| StorageUseProcent | STORAGE - StorageUseProcent | STORAGE | StorageUseProcent |

### VOLUME Section
| Key | Current Title/Description | Section | Value Name |
|-----|---------------------------|---------|------------|
| MicMuted | VOLUME - MicMuted | VOLUME | MicMuted |
| RingerMode | VOLUME - RingerMode | VOLUME | RingerMode |
| VolumeAccessibility | VOLUME - VolumeAccessibility | VOLUME | VolumeAccessibility |
| VolumeAlarm | VOLUME - VolumeAlarm | VOLUME | VolumeAlarm |
| VolumeMusic | VOLUME - VolumeMusic | VOLUME | VolumeMusic |
| VolumeNotification | VOLUME - VolumeNotification | VOLUME | VolumeNotification |
| VolumeRing | VOLUME - VolumeRing | VOLUME | VolumeRing |
| VolumeVoiceCall | VOLUME - VolumeVoiceCall | VOLUME | VolumeVoiceCall |

---

## XSight Agent Datapoints

**INI File:** `/sdcard/Download/XSightReport_AllJson.ini`  
**Data Type:** STRING  
**Section Parsing:** Keys with dots (e.g., `configuration.collectPeriod`) are split into section and value name. Keys without dots use section `Status`.

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

---

## Summary Statistics

- **Total Standard Predefined Datapoints:** 109
- **Total XSight Agent Datapoints:** 32
- **Total Datapoints:** 141

### Breakdown by Section (Standard Datapoints)
- APPS: 3
- BATTERY: 7
- BLUETOOTH: 5
- CELLULAR: 13
- DEVICE: 11
- DISPLAY: 9
- GPS: 3
- NETWORK: 35
- OS: 11
- PING_CONNECTIONS: 3
- RAM: 3
- SECURITY: 6
- SENSORS: 3
- STORAGE: 5
- VOLUME: 8

---

## API Implementation Details

When a datapoint is added to SOTI MobiControl, the API request structure is:

```json
{
  "Name": "<key>",  // Cannot be changed - this is the technical identifier
  "Description": "<customizable-title>",  // Can be customized - this is the "Title"
  "PhysicalType": "String",  // Always String for CustomData
  "DeviceFamily": "AndroidPlus",  // Device platform
  "DeviceKinds": ["AndroidPlus", "AndroidElm", "AndroidForWork", "AndroidKnox"],
  "Enabled": true,
  "Expression": "INI://<file>?SC=<section>&NM=<valName>"  // Cannot be changed - built from technical fields
}
```

**Note:** The `Expression` field is automatically built from:
- File path (cannot be changed)
- Section name (cannot be changed)
- Value name (cannot be changed)

Only the `Description` field (shown as "Title" in the UI) can be customized when adding datapoints to SOTI MobiControl.

