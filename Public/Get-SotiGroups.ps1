function Get-SotiGroups {
    <#
    .SYNOPSIS
        Fetches the device group tree from SOTI.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)] [string]$BaseUrl,
        [Parameter(Mandatory)] [string]$Token,
        [Parameter()] [int]$Take = 1000,
        [Parameter()] [int]$Skip = 0
    )

    $uri = "$BaseUrl/MobiControl/api/devicegroups?take=$Take&skip=$Skip"
    $headers = @{ Authorization = "Bearer $Token" }

    # The API returns a flat list usually, but let's check if it's paged
    # We might need to iterate if 'TotalCount' is > take, but start simple.
    
    $result = Invoke-SotiRequest -Url $uri -Method Get -Headers $headers
    
    # Depending on API version, sometimes it's directly an array, sometimes { "items": [] }
    if ($result -is [array]) {
        return $result
    } elseif ($result.items) {
        return $result.items
    } else {
        return $result
    }
}
