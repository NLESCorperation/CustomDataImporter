# Build Instructions

This folder contains build scripts for creating distributable packages of the SOTI Custom Data Importer.

## Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)

## Quick Start

### macOS
```bash
# From project root
./build/build-mac.sh
```

### Windows
```cmd
REM From project root
build\build-windows.bat
```

```powershell
# From project root
.\build\build-windows.ps1
```

### All Platforms (from macOS/Linux)
```bash
./build/build-all.sh
```

## Output

Built applications are placed in the `dist/` folder:

| Platform | Output |
|----------|--------|
| macOS local app | `dist/Mac-Apple-Silicon/` or `dist/Mac-Intel/` |
| macOS installer | `dist/SOTI Custom Data Importer-x.x.x-Apple-Silicon.dmg` or `dist/SOTI Custom Data Importer-x.x.x-Intel.dmg` |
| Windows installer | `dist/SOTI Custom Data Importer-x.x.x-Windows.exe` |
| Windows unpacked app | `dist/Windows/` |
| Linux | `dist/SOTI Custom Data Importer-x.x.x.AppImage` |

## Manual Build Commands

You can also run builds directly via npm:

```bash
# Install dependencies first
npm install

# Build for specific platform
npm run build               # Current platform
npm run build:mac           # macOS local .app bundle
npm run build:mac:installer # macOS unsigned local DMG artifacts
npm run build:win           # Windows x64 NSIS installer
npm run build:win:dir       # Windows x64 unpacked app for smoke testing
npm run build:linux         # Linux (.AppImage)
```

Windows certificate-bypass development launch commands:

```powershell
$env:SOTI_ALLOW_INSECURE_CERTS = "1"; npm start
```

```cmd
set SOTI_ALLOW_INSECURE_CERTS=1 && npm start
```

## Cross-Compilation Notes

- **Windows native builds**: Recommended for the Windows x64 installer and validated in GitHub Actions on `windows-latest`.
- **macOS → Windows**: Requires [Wine](https://wiki.winehq.org/macOS) for installer builds (`brew install --cask wine-stable`).
- **Linux → Windows**: Works out of the box with electron-builder
- **Windows → macOS**: Not supported (macOS requires Apple hardware for signing)
- **Local macOS DMGs**: `npm run build:mac:installer` disables automatic signing so local builds do not fail on cloud-synced FileProvider metadata. Use an explicit electron-builder signing configuration for production releases.

## Icons

The platform icon files are committed in this folder:

- `icon.icns` for macOS
- `icon.ico` for Windows
- `icon.png` for Linux

Regenerate them from the checked-in generator when the branding changes:

```bash
npm run build:icons
```

## Code Signing

For production distribution:

### macOS
Set these environment variables:
- `CSC_LINK` - Path to your .p12 certificate
- `CSC_KEY_PASSWORD` - Certificate password
- `APPLE_ID` - Your Apple ID for notarization
- `APPLE_APP_SPECIFIC_PASSWORD` - App-specific password

### Windows
Set these environment variables:
- `CSC_LINK` - Path to your code signing certificate
- `CSC_KEY_PASSWORD` - Certificate password

Without code signing, the app will work but users will see security warnings.
