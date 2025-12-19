function Protect-String {
    param([string]$String)
    
    if ($IsWindows -or $env:OS -eq 'Windows_NT') {
        # Windows: Use DPAPI for actual security
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($String)
        $protected = [System.Security.Cryptography.ProtectedData]::Protect($bytes, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
        return [Convert]::ToBase64String($protected)
    } else {
        # Non-Windows (dev/testing): Simple Base64 encoding (NOT secure for production!)
        Write-Warning "Running on non-Windows. Using Base64 encoding (not secure - dev mode only)."
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($String)
        return "DEV:" + [Convert]::ToBase64String($bytes)
    }
}

function Unprotect-String {
    param([string]$Base64)
    if ([string]::IsNullOrEmpty($Base64)) { return "" }
    
    try {
        if ($Base64.StartsWith("DEV:")) {
            # Dev mode encoding
            $encoded = $Base64.Substring(4)
            $bytes = [Convert]::FromBase64String($encoded)
            return [System.Text.Encoding]::UTF8.GetString($bytes)
        } elseif ($IsWindows -or $env:OS -eq 'Windows_NT') {
            # Windows: DPAPI
            $bytes = [Convert]::FromBase64String($Base64)
            $unprotected = [System.Security.Cryptography.ProtectedData]::Unprotect($bytes, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
            return [System.Text.Encoding]::UTF8.GetString($unprotected)
        } else {
            # Fallback: treat as plain base64
            $bytes = [Convert]::FromBase64String($Base64)
            return [System.Text.Encoding]::UTF8.GetString($bytes)
        }
    } catch {
        Write-Warning "Failed to decrypt string: $($_.Exception.Message)"
        return ""
    }
}

