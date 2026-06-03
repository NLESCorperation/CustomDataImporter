#!/usr/bin/env pwsh

$ErrorActionPreference = "Stop"

Write-Host "================================================"
Write-Host "  SOTI Custom Data Importer - Windows Build"
Write-Host "================================================"
Write-Host ""

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $projectRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js is not installed. Please install Node.js 18+ first."
}

Write-Host "Installing dependencies..."
npm install

Write-Host ""
Write-Host "Building Windows x64 application..."
npm run build:win

Write-Host ""
Write-Host "Build complete!"
Write-Host "Output location: dist\"
Write-Host ""
Write-Host "The Windows x64 installer is ready for distribution."
