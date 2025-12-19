function Get-SotiCustomAttributeDefinitions {
    <#
    .SYNOPSIS
        Retrieves all custom attribute definitions from SOTI MobiControl.
    .DESCRIPTION
        Gets the list of all custom attribute definitions configured in the SOTI MobiControl system.
        These definitions describe what custom attributes are available (name, data type, etc.)
    .PARAMETER BaseUrl
        The base URL of the SOTI MobiControl server.
    .PARAMETER Token
        The OAuth2 access token.
    .EXAMPLE
        $attributes = Get-SotiCustomAttributeDefinitions -BaseUrl "https://mobi.corp.com" -Token $token
        $attributes | Format-Table Name, DataType
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)] [string]$BaseUrl,
        [Parameter(Mandatory)] [string]$Token
    )

    # Construct URI: GET /api/customattributes
    $uri = "$BaseUrl/MobiControl/api/customattributes"

    $headers = @{
        "Authorization" = "Bearer $Token"
    }

    Write-Verbose "Fetching custom attribute definitions from $uri"

    try {
        $result = Invoke-SotiRequest -Url $uri -Method Get -Headers $headers
        
        # Handle different response formats
        if ($result -is [array]) {
            return $result
        }
        elseif ($result.items) {
            return $result.items
        }
        else {
            return $result
        }
    }
    catch {
        Write-Warning "Failed to fetch custom attribute definitions: $_"
        return @()
    }
}
