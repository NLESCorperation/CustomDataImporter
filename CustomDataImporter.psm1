# CustomDataImporter.psm1

# Load Private Functions
$privateFiles = Get-ChildItem -Path (Join-Path $PSScriptRoot "Private") -Filter "*.ps1"
foreach ($file in $privateFiles) {
    . $file.FullName
}

# Load Public Functions
$publicFiles = Get-ChildItem -Path (Join-Path $PSScriptRoot "Public") -Filter "*.ps1"
foreach ($file in $publicFiles) {
    . $file.FullName
}

function Start-CustomDataImporter {
    <#
    .SYNOPSIS
        Launches the Custom Data Importer WPF UI.
    .DESCRIPTION
        Loads WPF assemblies, parses the MainWindow.XAML, and displays the interactive window.
    #>
    
    Write-Host "Starting Custom Data Importer UI..."
    
    # Load required WPF assemblies
    Add-Type -AssemblyName PresentationFramework
    Add-Type -AssemblyName PresentationCore
    Add-Type -AssemblyName WindowsBase
    
    # Load XAML file
    $xamlPath = Join-Path $PSScriptRoot "UI" "MainWindow.xaml"
    if (-not (Test-Path $xamlPath)) {
        Throw "UI file not found: $xamlPath"
    }

    # Read and parse XAML
    [xml]$xaml = Get-Content -Path $xamlPath -Raw
    
    # Remove x:Name attributes that cause issues with XamlReader
    $xaml.Window.RemoveAttribute('xmlns:x')
    
    # Create XmlNodeReader and load the Window
    $reader = New-Object System.Xml.XmlNodeReader $xaml
    $window = [Windows.Markup.XamlReader]::Load($reader)
    
    # Get named controls for interaction
    $script:SearchBox = $window.FindName("SearchBox")
    $script:GroupTree = $window.FindName("GroupTree")
    $script:ManualKey = $window.FindName("ManualKey")
    $script:ManualValue = $window.FindName("ManualValue")
    $script:CustomDefinitionsGrid = $window.FindName("CustomDefinitionsGrid") # New Grid
    $script:ThemeSelector = $window.FindName("ThemeSelector")
    
    # --- LOGIC START ---
    
    # 0. Load Settings & Apply Theme
    $script:AppSettings = Get-AppSettings
    Set-AppTheme -ThemeName $script:AppSettings.Theme -Window $window | Out-Null
    
    # Update UI Selection to match loaded setting
    $selectedItem = $script:ThemeSelector.Items | Where-Object { $_.Content -eq $script:AppSettings.Theme }
    if ($selectedItem) {
        $script:ThemeSelector.SelectedItem = $selectedItem
    }
    
    # Theme Change Handler
    $script:ThemeSelector.Add_SelectionChanged({
            param($sender, $e)
            if ($script:ThemeSelector.SelectedItem) {
                $newTheme = $script:ThemeSelector.SelectedItem.Content
                Set-AppTheme -ThemeName $newTheme -Window $window | Out-Null
            
                # Save Preference
                $script:AppSettings.Theme = $newTheme
                Save-AppSettings -Settings $script:AppSettings
            }
        })
    
    # 1. Authenticate
    $profiles = Get-SotiConfig
    if ($profiles.Count -eq 0) {
        [System.Windows.MessageBox]::Show("No SOTI profiles found. Please run 'Seed-Credentials.ps1' or configure profiles first.", "Configuration Missing", [System.Windows.MessageBoxButton]::OK, [System.Windows.MessageBoxImage]::Warning)
    }
    else {
        $sotiProfile = $profiles[0] # Using first profile for now
        $script:BaseUrl = $sotiProfile.BaseUrl
        
        try {
            $script:Token = Get-SotiToken -BaseUrl $sotiProfile.BaseUrl -ClientId $sotiProfile.ClientId -ClientSecret $sotiProfile.ClientSecret -Username $sotiProfile.Username -Password $sotiProfile.Password
            
            # 2. Populate Group Tree
            Initialize-GroupTree -BaseUrl $script:BaseUrl -Token $script:Token
            
        }
        catch {
            [System.Windows.MessageBox]::Show("Failed to authenticate with SOTI: $($_.Exception.Message)", "Authentication Error", [System.Windows.MessageBoxButton]::OK, [System.Windows.MessageBoxImage]::Error)
        }
    }
    
    # 3. Search Handler (Basic Filter)
    $script:SearchBox.Add_TextChanged({
            param($sender, $e)
            # TODO: Implement tree filtering if needed
        })

    # 4. Group Selection Handler
    $script:GroupTree.Add_SelectedItemChanged({
            param($sender, $e)
            $selectedItem = $script:GroupTree.SelectedItem
            if ($selectedItem -and $selectedItem.Tag) {
                $groupId = $selectedItem.Tag
                Update-GroupCustomDataView -GroupId $groupId
            }
        })
        

    # --- LOGIC END ---

    # Show the window (modal dialog)
    $window.ShowDialog() | Out-Null
    
    return $window
}

# Helper to populate tree
function Initialize-GroupTree {
    param($BaseUrl, $Token)
    
    $script:GroupTree.Items.Clear()
    
    try {
        $groups = Get-SotiGroups -BaseUrl $BaseUrl -Token $Token
        
        # Build Hierarchy. SOTI groups have referenceId and valid ParentReferenceId logic?
        # Usually checking for groups where parentReferenceId is empty or root.
        
        # Determine Root Groups
        # If API returns a flat list, we need to map them.
        # However, for simplicity/speed in this robust environment, let's assume we handle a flat structure or root-first safely.
        
        # Map by ID for easy lookup
        $groupMap = @{}
        foreach ($g in $groups) {
            $groupMap[$g.referenceId] = $g
        }
        
        # Create TreeViewItems map
        $itemMap = @{}
        
        # First pass: Create all items
        foreach ($g in $groups) {
            $item = New-Object System.Windows.Controls.TreeViewItem
            $item.Header = $g.name
            $item.Tag = $g.referenceId # Store ID in Tag
            
            # Icon styling could go here
            
            $itemMap[$g.referenceId] = $item
        }
        
        # Second pass: Associate parents
        foreach ($g in $groups) {
            $currentItem = $itemMap[$g.referenceId]
            
            if (-not [string]::IsNullOrEmpty($g.parentReferenceId) -and $itemMap.ContainsKey($g.parentReferenceId)) {
                $parentItem = $itemMap[$g.parentReferenceId]
                $parentItem.Items.Add($currentItem) | Out-Null
            }
            else {
                # Add to root if no parent found (or it is a root)
                $script:GroupTree.Items.Add($currentItem) | Out-Null
            }
        }
    }
    catch {
        [System.Windows.MessageBox]::Show("Failed to load Device Groups: $_", "Error", [System.Windows.MessageBoxButton]::OK, [System.Windows.MessageBoxImage]::Error)
    }
}

# Helper to load data for group
function Update-GroupCustomDataView {
    param($GroupId)
    
    if (-not $script:CustomDefinitionsGrid) { return }
    
    # Clear existing
    $script:CustomDefinitionsGrid.ItemsSource = $null
    
    try {
        $definitions = Get-SotiGroupCustomData -BaseUrl $script:BaseUrl -Token $script:Token -GroupId $GroupId
        
        # Data Binding needs a list of objects. `definitions` is a generic object array from JSON.
        # We might need to select properties to match the Grid bindings (Name, BuildType, IsEnabled)
        
        # Transform if necessary (ensure properties exist)
        $viewData = @()
        foreach ($def in $definitions) {
            # Normalize properties
            $obj = [PSCustomObject]@{
                Name      = if ($def.Name) { $def.Name } else { "Unknown" }
                BuildType = if ($def.BuildType) { $def.BuildType } else { "Static" }
                IsEnabled = if ($null -ne $def.Enabled) { $def.Enabled } else { $true }
            }
            $viewData += $obj
        }
        
        $script:CustomDefinitionsGrid.ItemsSource = $viewData
        
    }
    catch {
        # Silent fail or log
        Write-Warning "Failed to load custom data for group $GroupId"
    }
}
```
