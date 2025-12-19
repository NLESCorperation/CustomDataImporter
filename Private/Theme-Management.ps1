function Get-SystemTheme {
    <#
    .SYNOPSIS
        Detects the current system theme (Dark or Light).
    .DESCRIPTION
        Checks macOS or Windows registry/defaults to determine if the system is in Dark Mode or Light Mode.
        Returns 'Dark' or 'Light'.
    #>
    
    if ($IsMacOS) {
        # macOS: Use defaults command
        try {
            $style = Invoke-Command -ScriptBlock { defaults read -g AppleInterfaceStyle } -ErrorAction SilentlyContinue
            if ($style -eq 'Dark') {
                return 'Dark'
            }
        }
        catch {
            # defaults read throws if Key doesn't exist (which means Light mode usually)
        }
        return 'Light'
    }
    elseif ($IsWindows -or $env:OS -eq 'Windows_NT') {
        # Windows: Check Registry for AppsUseLightTheme
        try {
            # Personalize Key for Apps
            $regKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize"
            $val = Get-ItemProperty -Path $regKey -Name "AppsUseLightTheme" -ErrorAction SilentlyContinue
            
            if ($val -ne $null -and $val.AppsUseLightTheme -eq 0) {
                return 'Dark'
            }
            return 'Light'
        }
        catch {
            return 'Light'
        }
    }
    else {
        # Fallback for Linux or unknown
        return 'Light'
    }
}

function Set-AppTheme {
    <#
    .SYNOPSIS
        Applies the specified theme to the Application Resources.
    .PARAMETER ThemeName
        'Dark', 'Light', or 'System'.
    #>
    param (
        [string]$ThemeName = 'System',
        [System.Windows.Window]$Window
    )

    $effectiveTheme = $ThemeName
    if ($ThemeName -eq 'System') {
        $effectiveTheme = Get-SystemTheme
    }

    # Normalize
    if ($effectiveTheme -notin @('Dark', 'Light')) {
        $effectiveTheme = 'Light'
    }

    $themePath = Join-Path $PSScriptRoot "..\UI\Themes\$effectiveTheme.xaml"
    if (-not (Test-Path $themePath)) {
        Write-Warning "Theme file not found: $themePath"
        return
    }

    try {
        # Load the dictionary
        # In PowerShell WPF, we often deal with [System.Windows.Application]::Current.Resources 
        # But if we just launched a Window without a full App wrapper, we might need to set Window.Resources
        
        $xamlContent = Get-Content -Path $themePath -Raw
        $reader = [System.Xml.XmlReader]::Create([System.IO.StringReader]::new($xamlContent))
        $resourceDict = [Windows.Markup.XamlReader]::Load($reader)

        # Apply to Window Resources (clearing old specific theme resources if needed)
        # MergedDictionaries is the cleaner way if we want to support other resources too.
        
        if ($Window) {
            $Window.Resources.MergedDictionaries.Clear()
            $Window.Resources.MergedDictionaries.Add($resourceDict)
        }
        
    }
    catch {
        Write-Warning "Failed to apply theme $effectiveTheme : $_"
    }

    return $effectiveTheme
}
