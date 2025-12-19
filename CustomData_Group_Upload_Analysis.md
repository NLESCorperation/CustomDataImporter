# CustomData Group Upload Analysis

## Summary

**Direct CustomData upload to groups is NOT supported through the SOTI MobiControl REST API.**

## Key Findings

### 1. CustomData is Device-Level Only

According to the API documentation and codebase analysis:

- **CustomData** is designed for **device-level monitoring and data collection**
- CustomData values are automatically collected from devices based on device update schedules
- CustomData values are retrieved as part of device objects, not group objects
- The API documentation explicitly states: *"CustomData endpoints directly on device groups (like `/api/devicegroups/{id}/customdata`) may not be available or may return 404. CustomData is primarily device-level monitoring data."*

### 2. Available CustomData Endpoints

#### CustomData Definitions (Property Management)
- `GET /api/customdata` - List all CustomData property definitions
- `POST /api/customdata` - Create new CustomData property definition
- `GET /api/customdata/{name}` - Get CustomData property by name
- `PUT /api/customdata/{name}` - Update CustomData property by name
- `DELETE /api/customdata/{name}` - Delete CustomData property by name

#### CustomData Values (Device-Level Only)
- `GET /api/devices/{deviceId}?fields=CustomData` - Get device with CustomData values
- `GET /api/devices?fields=CustomData` - List devices with CustomData values
- `GET /api/devices/search?filter=CustomData.{FieldName}='value'` - Search devices by CustomData

**Note:** There are **NO PUT/POST endpoints** for setting CustomData values on devices or groups. CustomData values are automatically collected by the system.

### 3. Group-Level Endpoints

#### Custom Attributes (Available for Groups)
- `GET /api/devicegroups/{path}/customAttributes` - Get custom attributes for a group
- `PUT /api/devicegroups/{path}/customAttributes` - Batch update custom attributes
- `PUT /api/devicegroups/{path}/customAttributes/{name}` - Update single custom attribute

#### CustomData Endpoints (Not Available for Groups)
- `GET /api/devicegroups/{path}/customdata` - **May return 404 or be unavailable**
- `PUT /api/devicegroups/{path}/customdata` - **Does not exist**
- `POST /api/devicegroups/{path}/customdata` - **Does not exist**

### 4. Current Workaround in Codebase

The codebase currently uses **Custom Attributes** as a workaround to store CustomData configuration on groups:

1. **CustomDataConfig Custom Attribute**: The application stores CustomData configuration as a JSON string in a Custom Attribute named `CustomDataConfig`
2. **Endpoint Used**: `PUT /api/devicegroups/{path}/customAttributes/CustomDataConfig`
3. **Purpose**: This stores the *configuration* for which CustomData properties should be enabled/disabled on devices in the group, but does not actually upload CustomData values

### 5. Evidence from Codebase

#### Test Scripts Attempted CustomData Endpoints
- `debug_discovery.js` (lines 109-113) probes for CustomData endpoints on groups but expects them to fail
- `test-soti-api.js` (line 58) has a commented attempt at `/devicegroups/{id}/customData/{name}` but it's not implemented

#### Renderer.js Implementation
- Line 1374: Attempts to fetch from `/api/devicegroups/{path}/customdata` but handles failure gracefully
- Line 482-700: `applyCustomDataToGroup()` function uses Custom Attributes endpoints, not CustomData endpoints
- The function stores configuration in Custom Attributes, not actual CustomData values

## CustomData vs Custom Attributes

| Feature | CustomData | Custom Attributes |
|---------|-----------|-------------------|
| **Purpose** | Device monitoring and data collection | Metadata and organizational tags |
| **Collection** | Automatically collected from devices | Manually set by administrators |
| **Build Types** | Text File, Registry, INI, XML, etc. | Static values only |
| **Group Support** | ❌ No (device-level only) | ✅ Yes |
| **API Endpoints** | `/api/customdata` (definitions only) | `/api/devicegroups/{path}/customAttributes` |
| **Values Can Be Set** | ❌ No (auto-collected) | ✅ Yes (via PUT) |

## Conclusion

**You cannot upload CustomData values directly to groups through the API** because:

1. CustomData is designed for automatic device-level data collection
2. There are no PUT/POST endpoints for setting CustomData values (even on devices)
3. CustomData values are read-only from the API perspective - they're collected by the SOTI MobiControl agent on devices
4. The only way to work with CustomData on groups is to:
   - Store configuration/metadata in Custom Attributes (as the codebase currently does)
   - Configure which CustomData properties should be enabled/disabled for devices in the group
   - Let the system automatically collect CustomData values from devices based on those configurations

## Recommendations

If you need to store data on groups that resembles CustomData:

1. **Use Custom Attributes** - This is what the current codebase does and is the supported approach
2. **Store configuration, not values** - Custom Attributes can store JSON configuration about which CustomData properties to enable
3. **Let devices collect values** - CustomData values will be automatically collected from devices based on the CustomData property definitions and group configurations

## References

- API Documentation: `SOTI_CustomData_API_Documentation.md` (line 116)
- Implementation: `src/renderer.js` (function `applyCustomDataToGroup`)
- Test Scripts: `debug_discovery.js`, `test-soti-api.js`

