function Get-SotiDevices {
    <#
    .SYNOPSIS
        Searches for devices in SOTI MobiControl.
    .DESCRIPTION
        Retrieves a list of devices based on a filter criteria using the SOTI MobiControl REST API.
    .PARAMETER BaseUrl
        The base URL of the SOTI MobiControl server (e.g., https://soti.example.com).
    .PARAMETER Token
        The OAuth2 access token.
    .PARAMETER Filter
        The search filter expression (e.g., "Manufacturer='Apple'"). Special characters are automatically URL encoded.
    .PARAMETER Take
        The maximum number of records to return (Default: 100).
    .PARAMETER Skip
        The number of records to skip (Default: 0).
    .EXAMPLE
        Get-SotiDevices -BaseUrl "https://mobi.corp.com" -Token $token -Filter "BatteryStatus > 20"
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)] [string]$BaseUrl,
        [Parameter(Mandatory)] [string]$Token,
        [Parameter()] [string]$Filter,
        [Parameter()] [int]$Take = 100,
        [Parameter()] [int]$Skip = 0
    )

    $uri = "$BaseUrl/MobiControl/api/devices/search?take=$Take&skip=$Skip"
    
    if (-not [string]::IsNullOrEmpty($Filter)) {
        # URL Encode the filter string to handle special chars like spacing, =, ' safely
        $encodedFilter = [System.Web.HttpUtility]::UrlEncode($Filter)
        $uri += "&filter=$encodedFilter"
    }

    $headers = @{
        "Authorization" = "Bearer $Token"
    }

    Write-Verbose "Searching devices with URI: $uri"

    return Invoke-SotiRequest -Url $uri -Method Get -Headers $headers
}
