function Get-SotiToken {
    <#
    .SYNOPSIS
        Retrieves an OAuth2 Access Token from the SOTI Identity Provider.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)] [string]$BaseUrl,
        [Parameter(Mandatory)] [string]$ClientId,
        [Parameter(Mandatory)] [string]$ClientSecret,
        [Parameter(Mandatory)] [string]$Username,
        [Parameter(Mandatory)] [string]$Password
    )

    $tokenUrl = "$BaseUrl/MobiControl/api/token"
    
    # Per docs: Authorization: Basic Base64(ClientId:ClientSecret)
    $authString = "$($ClientId):$($ClientSecret)"
    $authBytes = [System.Text.Encoding]::ASCII.GetBytes($authString)
    $authHeaderVal = "Basic " + [Convert]::ToBase64String($authBytes)
    
    $headers = @{
        "Authorization" = $authHeaderVal
        "Content-Type"  = "application/x-www-form-urlencoded"
    }

    $body = @{
        grant_type = "password"
        username   = $Username
        password   = $Password
    }

    try {
        Write-Verbose "Requesting new token from $tokenUrl"
        $response = Invoke-RestMethod -Uri $tokenUrl -Method Post -Headers $headers -Body $body
        return $response.access_token
    } catch {
        Write-Error "Failed to authenticate with SOTI Server. Check credentials and URL."
        throw $_
    }
}
