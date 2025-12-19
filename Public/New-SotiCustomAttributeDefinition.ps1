function New-SotiCustomAttributeDefinition {
    <#
    .SYNOPSIS
        Creates a new custom attribute definition in SOTI MobiControl.
    .DESCRIPTION
        Creates a new custom attribute definition that can then be used on devices and device groups.
        The attribute must be created before values can be assigned.
    .PARAMETER BaseUrl
        The base URL of the SOTI MobiControl server.
    .PARAMETER Token
        The OAuth2 access token.
    .PARAMETER Name
        The name of the custom attribute to create.
    .PARAMETER DataType
        The data type of the attribute. Valid values: Text, Numeric, Date, Boolean, Enumerator
    .PARAMETER EnumeratorValues
        If DataType is Enumerator, provide a comma-separated list of allowed values.
    .EXAMPLE
        New-SotiCustomAttributeDefinition -BaseUrl "https://mobi.corp.com" -Token $token -Name "Location" -DataType "Text"
    .EXAMPLE
        New-SotiCustomAttributeDefinition -BaseUrl "https://mobi.corp.com" -Token $token -Name "Department" -DataType "Enumerator" -EnumeratorValues "Sales,Engineering,HR,Finance"
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)] [string]$BaseUrl,
        [Parameter(Mandatory)] [string]$Token,
        [Parameter(Mandatory)] [string]$Name,
        [Parameter(Mandatory)] 
        [ValidateSet("Text", "Numeric", "Date", "Boolean", "Enumerator")]
        [string]$DataType,
        [Parameter()] [string]$EnumeratorValues
    )

    # Construct URI: POST /api/customattributes
    $uri = "$BaseUrl/MobiControl/api/customattributes"

    $headers = @{
        "Authorization" = "Bearer $Token"
    }

    # Build the definition object
    $definition = @{
        name     = $Name
        dataType = $DataType
    }

    # Add enumerator values if applicable
    if ($DataType -eq "Enumerator" -and $EnumeratorValues) {
        $definition.enumeratorValues = $EnumeratorValues
    }

    Write-Verbose "Creating custom attribute definition: $Name ($DataType)"
    Write-Verbose "API URL: $uri"

    try {
        return Invoke-SotiRequest -Url $uri -Method Post -Headers $headers -Body $definition
    }
    catch {
        Write-Error "Failed to create custom attribute '$Name': $_"
        throw
    }
}
