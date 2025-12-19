# SOTI MobiControl CustomData API Documentation

## Overview
CustomData APIs allow you to create and manage custom monitoring fields for devices in SOTI MobiControl. These are **different from Custom Attributes** - CustomData is used for device monitoring and data collection, while Custom Attributes are metadata fields.

**Note:** CustomData APIs were introduced in SOTI MobiControl version 15.0.0.

---

## CustomData Definition/Property Management

These endpoints manage the **definitions** of CustomData properties (what fields exist, their types, build types, etc.).

### Base Endpoints

All CustomData definition endpoints are under `/MobiControl/api/customdata` or `/MobiControl/api/v1/customdata` (depending on API version).

### 1. List All CustomData Properties
- **Endpoint:** `GET /api/customdata`
- **Description:** Fetches a list of all custom data properties defined in the system
- **Response:** Array of CustomData property definitions

### 2. Create New CustomData Property
- **Endpoint:** `POST /api/customdata`
- **Description:** Creates a new custom data property definition
- **Request Body:** Should include:
  - `name`: Name of the custom data property
  - `buildType`: How data is collected (see Build Types below)
  - `dataType`: Type of data (Text, Numeric, Date, Boolean, etc.)
  - `description`: Description of the property
  - Additional fields based on build type

### 3. Get CustomData Property by Name
- **Endpoint:** `GET /api/customdata/{name}`
- **Description:** Retrieves details of a specific custom data property by its name

### 4. Update CustomData Property by Name
- **Endpoint:** `PUT /api/customdata/{name}`
- **Description:** Updates an existing custom data property by name

### 5. Delete CustomData Property by Name
- **Endpoint:** `DELETE /api/customdata/{name}`
- **Description:** Deletes a specific custom data property by name

### 6. Get CustomData Property by Reference ID
- **Endpoint:** `GET /api/customdata/{referenceID}`
- **Description:** Retrieves details of a specific custom data property by its reference ID

### 7. Update CustomData Property by Reference ID
- **Endpoint:** `POST /api/customdata/{referenceID}`
- **Description:** Updates an existing custom data property by reference ID

### 8. Delete CustomData Property by Reference ID
- **Endpoint:** `DELETE /api/customdata/{referenceID}`
- **Description:** Deletes a specific custom data property by reference ID

---

## CustomData Build Types

When creating or updating CustomData properties, you can specify various build types that determine how data is collected:

1. **Text File:** Retrieves content from a specified line in a text file on the device
2. **Registry:** Fetches values from the device's registry (not available on Android Plus or Linux devices)
3. **INI File:** Extracts values from a specified section in an `.INI` file
4. **Exit Code:** Captures the exit code of a specified executable (not available on Android Plus or Linux devices)
5. **STDOUT:** Retrieves the first line of output from a specified executable (not available on Android Plus devices)
6. **Static:** Assigns a static value that appears in the Device Information panel
7. **XML File:** Extracts values from a section in an `.XML` file (available only for Android Plus devices)
8. **Device APIs:** Uses device-specific APIs to retrieve data

### Embedded Queries
You can embed one query string within another using the format `%KeyName%`. Ensure that the embedded query is defined before the outer query. This functionality works with static-type queries.

---

## Retrieving CustomData Values

CustomData **values** (the actual data collected from devices) are retrieved as part of device or device group objects, not through separate endpoints.

### Devices

#### Get Device with CustomData
- **Endpoint:** `GET /api/devices/{deviceId}`
- **Query Parameters:**
  - `fields=CustomData` - Include CustomData in the response
- **Example:**
  ```
  GET /api/devices/{deviceId}?fields=CustomData
  ```

#### Search Devices by CustomData
- **Endpoint:** `GET /api/devices/search`
- **Query Parameters:**
  - `filter=CustomData.{FieldName}='value'` - Filter devices based on CustomData values
- **Example:**
  ```
  GET /api/devices/search?filter=CustomData.AssetTag='12345'
  ```

#### List Devices with CustomData
- **Endpoint:** `GET /api/devices`
- **Query Parameters:**
  - `fields=CustomData` - Include CustomData in the response
- **Example:**
  ```
  GET /api/devices?fields=CustomData&take=100
  ```

### Device Groups

CustomData values on device groups are typically retrieved as part of the device group object:
- **Endpoint:** `GET /api/devicegroups/{path}` or `GET /api/devicegroups/{id}`
- The response may include CustomData fields if they are configured for the group

**Note:** Based on codebase exploration, CustomData endpoints directly on device groups (like `/api/devicegroups/{id}/customdata`) may not be available or may return 404. CustomData is primarily device-level monitoring data.

---

## CustomData vs Custom Attributes

### CustomData
- **Purpose:** Device monitoring and data collection
- **Collection:** Automatically collected based on device update schedule and when device connects
- **Build Types:** Supports various build types (Text File, Registry, INI, etc.)
- **Display:** Shown in Device Information panel under Device Details tab
- **API Endpoints:** `/api/customdata` for definitions, values included in device objects

### Custom Attributes
- **Purpose:** Metadata and organizational tags
- **Collection:** Manually set by administrators
- **Build Types:** Not applicable (static values only)
- **Display:** Used for filtering, grouping, and organization
- **API Endpoints:** `/api/customattributes` for definitions, `/api/devicegroups/{path}/customAttributes` for values

---

## Authentication

All API requests require OAuth2 Bearer token authentication:
```
Authorization: Bearer {access_token}
```

For on-premises instances, generate API credentials using:
```
MCAdmin.exe APIClientAdd
```

For cloud-hosted instances, contact SOTI Support to request credentials.

---

## Accessing the Interactive API Documentation

To explore the CustomData APIs interactively:

1. Log into your SOTI MobiControl console
2. In the browser's address bar, replace everything after `MobiControl/` with `api`
3. Navigate to the new URL

**Example:**
- Original: `https://yourserver/MobiControl/WebConsole/home/devices`
- API: `https://yourserver/MobiControl/api`

This opens the interactive REST API environment where you can:
- Explore available endpoints
- View detailed documentation
- Test API calls
- See request/response examples

---

## Important Notes

1. **Version Requirement:** CustomData APIs require SOTI MobiControl version 15.0.0 or later
2. **Data Collection:** CustomData values are collected automatically based on the device update schedule and when devices connect to the server
3. **Platform Limitations:** Some build types (Registry, Exit Code, STDOUT) are not available on all platforms
4. **CustomData Manager:** The SOTI console includes a CustomData Manager that displays:
   - **Available Items:** Custom data items created but not displayed in Device Information panel
   - **Displayed Items:** Custom data items shown in Device Information panel
5. **API Versioning:** Some endpoints may use `/api/v1/customdata` instead of `/api/customdata` depending on your SOTI MobiControl version

---

## Example Use Cases

1. **Monitor Third-Party Application Data:** Create CustomData properties to track application-specific information
2. **Device Inventory:** Use CustomData to collect and display device inventory information
3. **Custom Reporting:** Retrieve CustomData values via API to build custom reports
4. **Device Filtering:** Use CustomData values to filter and search for specific devices

---

## References

- SOTI MobiControl CustomData Documentation: https://www.soti.net/mc/help/v15.3/en/console/devices/monitoring/customdata/customdata.html
- SOTI MobiControl REST API Documentation: https://www.soti.net/mc/help/v15.5/en/adminutility/tools/restapi.html
- CustomData Manager: https://soti.fr/mc/help/v14.4/en/console/reference/dialogs/devicesettings/customdatamanager.html

