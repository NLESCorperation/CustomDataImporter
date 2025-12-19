function Get-ConfigDirectory {
    # Cross-platform config directory
    if ($IsWindows -or $env:OS -eq 'Windows_NT') {
        return Join-Path $env:LOCALAPPDATA "CustomDataImporter"
    }
    elseif ($IsMacOS) {
        return Join-Path $HOME ".config/CustomDataImporter"
    }
    else {
        return Join-Path $HOME ".config/CustomDataImporter"
    }
}

function Get-SotiConfig {
    [CmdletBinding()]
    param()
    
    $configDir = Get-ConfigDirectory
    $configPath = Join-Path $configDir "profiles.json"
    
    if (-not (Test-Path $configPath)) {
        return @()
    }

    try {
        $json = Get-Content $configPath -Raw
        $profiles = $json | ConvertFrom-Json
        
        # Decrypt sensitive fields
        foreach ($p in $profiles) {
            if ($p.PSObject.Properties.Match('ClientSecret')) {
                $p.ClientSecret = Unprotect-String $p.ClientSecret
            }
            if ($p.PSObject.Properties.Match('Password')) {
                $p.Password = Unprotect-String $p.Password
            }
        }
        return $profiles
    }
    catch {
        Write-Warning "Could not load profiles: $($_.Exception.Message)"
        return @()
    }
}

function Save-SotiConfig {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)] [array]$Profiles
    )

    $configDir = Get-ConfigDirectory
    if (-not (Test-Path $configDir)) {
        New-Item -Path $configDir -ItemType Directory -Force | Out-Null
    }
    $configPath = Join-Path $configDir "profiles.json"

    # Clone and Encrypt
    $profilesToSave = @()
    foreach ($p in $Profiles) {
        $clone = $p | Select-Object * 
        $clone.ClientSecret = Protect-String $p.ClientSecret
        $clone.Password = Protect-String $p.Password
        $profilesToSave += $clone
    }

    $profilesToSave | ConvertTo-Json -Depth 5 | Set-Content -Path $configPath
    Write-Host "Saved to: $configPath"
}


function Get-AppSettings {
    [CmdletBinding()]
    param()
    
    $configDir = Get-ConfigDirectory
    $configPath = Join-Path $configDir "settings.json"
    
    $defaults = @{
        Theme = "System" 
    }
    
    if (-not (Test-Path $configPath)) {
        return [PSCustomObject]$defaults
    }

    try {
        $json = Get-Content $configPath -Raw
        $settings = $json | ConvertFrom-Json
        
        # Merge defaults
        if ($null -eq $settings.Theme) { $settings | Add-Member -NotePropertyName Theme -NotePropertyValue "System" -Force }
        
        return $settings
    }
    catch {
        return [PSCustomObject]$defaults
    }
}

function Save-AppSettings {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)] $Settings
    )

    $configDir = Get-ConfigDirectory
    if (-not (Test-Path $configDir)) {
        New-Item -Path $configDir -ItemType Directory -Force | Out-Null
    }
    $configPath = Join-Path $configDir "settings.json"

    $Settings | ConvertTo-Json -Depth 2 | Set-Content -Path $configPath
}
