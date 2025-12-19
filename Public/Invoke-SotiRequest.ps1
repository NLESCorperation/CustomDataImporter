function Invoke-SotiRequest {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)] [string]$Url,
        [Parameter(Mandatory)] [string]$Method,
        [Parameter()] [hashtable]$Headers,
        [Parameter()] [object]$Body,
        [switch]$SkipAuthHeader
    )

    $params = @{
        Uri         = $Url
        Method      = $Method
        ContentType = "application/json"
    }

    if ($Body) {
        $params.Body = $Body | ConvertTo-Json -Depth 10 -Compress
    }

    if ($Headers) {
        $params.Headers = $Headers
    }

    Write-Verbose "Invoking $Method $Url"

    try {
        $response = Invoke-RestMethod @params
        return $response
    } catch {
        $errParams = @{
            Message = "API Request Failed: $($_.Exception.Message)"
            Url = $Url
            Method = $Method
        }
        if ($_.Response) {
            try {
                $stream = $_.Response.GetResponseStream()
                $reader = [System.IO.StreamReader]::new($stream)
                $errBody = $reader.ReadToEnd()
                $errParams.ResponseBody = $errBody
            } catch {
                $errParams.ResponseBody = "Could not read error response body."
            }
        }
        
        # Log error to console/host for now, can be hooked into UI log later
        Write-Error (ConvertTo-Json $errParams -Depth 2)
        throw $_
    }
}
