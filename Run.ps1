# Run.ps1
# Main Launcher for SOTI Custom Data Importer with WPF UI

$modulePath = Join-Path $PSScriptRoot "CustomDataImporter.psm1"
Import-Module $modulePath -Force

Write-Host "--------------------------------------------------"
Write-Host " SOTI Custom Data Importer                       "
Write-Host "--------------------------------------------------"
Write-Host ""

# Launch the WPF UI
try {
    Start-CustomDataImporter
}
catch {
    Write-Error "Failed to launch UI: $_"
    Write-Host ""
    Write-Host "Note: This application requires Windows PowerShell with WPF support."
    Write-Host "Make sure you are running on Windows with .NET Framework available."
}
