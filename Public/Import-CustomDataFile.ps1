function Import-CustomDataFile {
    <#
    .SYNOPSIS
        Parses a file (INI, JSON, XML) and returns a hashtable of flattened Key/Value pairs.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)] [string]$FilePath,
        [Parameter()] [string]$Format # Optional override
    )

    if (-not (Test-Path $FilePath)) {
        Throw "File not found: $FilePath"
    }

    $extension = [System.IO.Path]::GetExtension($FilePath).ToLower()
    $data = @{}

    if ($Format -eq 'INI' -or ($null -eq $Format -and $extension -eq '.ini')) {
        # INI Parser (Treat sections as "Section.Key" or just "Key"?)
        # Requirement says "UNIFEL format. treat as INI style sections/keys"
        # We will flatten as "Section/Key" to be safe.
        $content = Get-Content $FilePath
        $currentSection = "Global"
        
        foreach ($line in $content) {
            $line = $line.Trim()
            if ([string]::IsNullOrEmpty($line) -or $line.StartsWith(';') -or $line.StartsWith('#')) { continue }
            
            if ($line -match '^\[(.*)\]$') {
                $currentSection = $matches[1]
            } elseif ($line -match '^([^=]+)=(.*)$') {
                $key = $matches[1].Trim()
                $val = $matches[2].Trim()
                # Store as "Section/Key" or just Key if User wants simple mapping?
                # Let's return a rich object so UI can decide mapping
                # But function contract says Hashtable.
                # Let's use dot notation "Section.Key"
                $data["$currentSection.$key"] = $val
            }
        }
    }
    elseif ($Format -eq 'JSON' -or ($null -eq $Format -and $extension -eq '.json')) {
        try {
            $jsonObj = Get-Content $FilePath -Raw | ConvertFrom-Json
            # Flatten generic JSON logic is complex.
            # Start with simple depth-1 properties
            foreach ($prop in $jsonObj.PSObject.Properties) {
                if ($prop.Value -is [string] -or $prop.Value -is [int] -or $prop.Value -is [bool]) {
                    $data[$prop.Name] = $prop.Value
                } else {
                    $data[$prop.Name] = "[Complex Object]" 
                }
            }
        } catch {
            Throw "Invalid JSON content."
        }
    }
    elseif ($Format -eq 'XML' -or ($null -eq $Format -and $extension -eq '.xml')) {
        try {
            [xml]$xml = Get-Content $FilePath
            # Assume simple Key/Value pairs or grab root elements
            if ($xml.DocumentElement) {
                foreach ($node in $xml.DocumentElement.ChildNodes) {
                    if ($node.NodeType -eq 'Element' -and $node.HasChildNodes -eq $false) {
                         # Empty
                    } elseif ($node.NodeType -eq 'Element' -and $node.ChildNodes.Count -eq 1 -and $node.FirstChild.NodeType -eq 'Text') {
                         $data[$node.Name] = $node.InnerText
                    }
                }
            }
        } catch {
            Throw "Invalid XML content."
        }
    }
    else {
        Throw "Unsupported file format: $extension"
    }

    return $data
}
