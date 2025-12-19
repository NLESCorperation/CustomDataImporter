@{
    RootModule = 'CustomDataImporter.psm1'
    ModuleVersion = '0.0.1'
    GUID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'
    Author = 'AntiGravity'
    Description = 'SOTI MobiControl Custom Data Importer Backend'
    FunctionsToExport = @('Start-CustomDataImporter', 'Invoke-SotiRequest', 'Get-SotiGroups', 'Set-SotiGroupCustomData')
}
