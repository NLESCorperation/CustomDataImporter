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

### All Platforms (from macOS/Linux)
```bash
./build/build-all.sh
```

## Output

Built applications are placed in the `dist/` folder:

| Platform | Output |
|----------|--------|
| macOS | `dist/SOTI Custom Data Importer-x.x.x.dmg` |
| Windows | `dist/SOTI Custom Data Importer Setup x.x.x.exe` |
| Linux | `dist/SOTI Custom Data Importer-x.x.x.AppImage` |

## Manual Build Commands

You can also run builds directly via npm:

```bash
# Install dependencies first
npm install

# Build for specific platform
npm run build:mac     # macOS (.dmg)
npm run build:win     # Windows (.exe)
npm run build:linux   # Linux (.AppImage)
```

## Cross-Compilation Notes

- **macOS → Windows**: Requires [Wine](https://wiki.winehq.org/macOS) (`brew install --cask wine-stable`)
- **Linux → Windows**: Works out of the box with electron-builder
- **Windows → macOS**: Not supported (macOS requires Apple hardware for signing)

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

