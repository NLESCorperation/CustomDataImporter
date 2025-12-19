function Get-SotiGroupCustomData {
    <#
    .SYNOPSIS
        Fetches the Custom Data configuration for a specific device group.
        
    .DESCRIPTION
        Retrieves the 'CustomDataConfig' property from the SOTI Device Group. 
        It assumes the data is stored as a JSON string within a Custom Attribute or Property named 'CustomDataConfig'.
        
    .PARAMETER BaseUrl
        The base URL of the SOTI MobiControl server.
        
    .PARAMETER Token
        The OAuth2 access token.
        
    .PARAMETER GroupPath
        The full path of the Device Group (e.g., "\\MyCompany\\Devices\\Android").
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)] [string]$BaseUrl,
        [Parameter(Mandatory)] [string]$Token,
        [Parameter(Mandatory)] [string]$GroupPath
    )

    # 1. Fetch the Group Details using URL-encoded path
    # Endpoint: /api/devicegroups/{path}
    $encodedPath = [System.Web.HttpUtility]::UrlEncode($GroupPath)
    $uri = "$BaseUrl/MobiControl/api/devicegroups/$encodedPath"
    $headers = @{ Authorization = "Bearer $Token" }
    
    try {
        $group = Invoke-SotiRequest -Url $uri -Method Get -Headers $headers
        
        # 2. Extract the Custom Property/Attribute
        # We look for a property that might contain our JSON config.
        # This part is speculative based on the user request "Property of the groups"
        # Common places: 'customAttributes', or a specific named property if extended.
        
        # NOTE: If SOTI returns customAttributes as a list, we filter.
        # If it's a direct property, we access it.
        
        # Checking for standard Custom Attributes collection
        $configBlob = $null
        
        if ($group.customAttributes) {
            $configAttr = $group.customAttributes | Where-Object { $_.name -eq 'CustomDataConfig' }
            if ($configAttr) {
                $configBlob = $configAttr.value
            }
        }
        
        # Fallback: Check if it's just a top-level property (unlikely for standard SOTI but possible if wrapped)
        if (-not $configBlob -and $group.CustomDataConfig) {
            $configBlob = $group.CustomDataConfig
        }
        
        if ([string]::IsNullOrWhiteSpace($configBlob)) {
            Write-Verbose "No 'CustomDataConfig' found for group $GroupId"
            return @()
        }
        
        # 3. Parse and Return
        # The data is expected to be a JSON array of definitions
        try {
            return $configBlob | ConvertFrom-Json
        }
        catch {
            Write-Warning "Failed to parse CustomDataConfig JSON for group $GroupId"
            return @()
        }

    }
    catch {
        Write-Error "Failed to fetch group details: $_"
        return @()
    }
}
