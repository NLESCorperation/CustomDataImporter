function Set-SotiGroupCustomAttribute {
    <#
    .SYNOPSIS
        Updates a custom attribute for a device group.
    .DESCRIPTION
        Sets the value of a custom attribute for a device group identified by its path using the SOTI MobiControl REST API.
    .PARAMETER BaseUrl
        The base URL of the SOTI MobiControl server.
    .PARAMETER Token
        The OAuth2 access token.
    .PARAMETER GroupPath
        The full path of the device group (e.g., "\\MyCompany\\Devices\\Android").
    .PARAMETER AttributeName
        The name of the custom attribute to update.
    .PARAMETER Value
        The value to set for the custom attribute.
    .EXAMPLE
        Set-SotiGroupCustomAttribute -BaseUrl "https://mobi.corp.com" -Token $token -GroupPath "\Devices\Android" -AttributeName "Location" -Value "Building A"
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)] [string]$BaseUrl,
        [Parameter(Mandatory)] [string]$Token,
        [Parameter(Mandatory)] [string]$GroupPath,
        [Parameter(Mandatory)] [string]$AttributeName,
        [Parameter(Mandatory)] [string]$Value
    )

    # URL-encode the group path
    $encodedPath = [System.Web.HttpUtility]::UrlEncode($GroupPath)
    
    # Construct URI: PUT /api/devicegroups/{path}/customAttributes/{customAttributeName}
    $uri = "$BaseUrl/MobiControl/api/devicegroups/$encodedPath/customAttributes/$AttributeName"

    $headers = @{
        "Authorization" = "Bearer $Token"
    }

    Write-Verbose "Updating Custom Attribute '$AttributeName' for Group '$GroupPath' to '$Value'"
    Write-Verbose "API URL: $uri"

    return Invoke-SotiRequest -Url $uri -Method Put -Headers $headers -Body $Value
}
