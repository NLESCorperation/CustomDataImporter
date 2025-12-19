function Set-SotiCustomAttribute {
    <#
    .SYNOPSIS
        Updates a custom attribute for a specific device.
    .DESCRIPTION
        Sets the value of a custom attribute for a device identified by its Device ID using the SOTI MobiControl REST API.
    .PARAMETER BaseUrl
        The base URL of the SOTI MobiControl server.
    .PARAMETER Token
        The OAuth2 access token.
    .PARAMETER DeviceId
        The unique identifier of the device.
    .PARAMETER AttributeName
        The name of the custom attribute to update.
    .PARAMETER Value
        The value to set for the custom attribute.
    .EXAMPLE
        Set-SotiCustomAttribute -BaseUrl "https://mobi.corp.com" -Token $token -DeviceId "devicespecificid" -AttributeName "AssetNumber" -Value "12345"
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)] [string]$BaseUrl,
        [Parameter(Mandatory)] [string]$Token,
        [Parameter(Mandatory)] [string]$DeviceId,
        [Parameter(Mandatory)] [string]$AttributeName,
        [Parameter(Mandatory)] [string]$Value
    )

    # Construct URI: PUT /api/devices/{deviceId}/customAttributes/{customAttributeName}
    # Note: AttributeName in URL generally needs to be the name, not ID, per SOTI docs.
    $uri = "$BaseUrl/MobiControl/api/devices/$DeviceId/customAttributes/$AttributeName"

    $headers = @{
        "Authorization" = "Bearer $Token"
    }

    # The body for this endpoint is typically checking for a raw JSON string of the value
    # e.g. "myValue" (with quotes if string)
    # We will use Invoke-SotiRequest which handles JSON conversion via Body param if we pass an object/string
    # However, simply passing a string to ConvertTo-Json results in "string", which is correct.
    
    Write-Verbose "Updating Custom Attribute '$AttributeName' for Device '$DeviceId' to '$Value'"

    return Invoke-SotiRequest -Url $uri -Method Put -Headers $headers -Body $Value
}
