# SOTI Custom Data Importer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A cross-platform Electron application for importing and managing Custom Data in SOTI MobiControl. This tool simplifies the process of creating Custom Data definitions and populating them across device groups.

## 🚀 Features

- **Cross-Platform**: Runs on macOS and Windows.
- **Easy Import**: Import custom data definitions from CSV or JSON.
- **Group Management**: Select and apply custom data to specific device groups in SOTI MobiControl.
- **Modern UI**: Clean, responsive interface built with HTML/CSS and Electron.
- **Secure**: Stores saved SOTI API profiles with Electron safeStorage and OS-backed encryption.

## 🛠️ Prerequisites

- **Node.js**: Version 18 or later is recommended.
- **npm**: Version 9 or later.
- **SOTI MobiControl**: Version 15.0.0 or later for Custom Data API support.

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yannickweijenberg/CustomDataImporter.git
   cd CustomDataImporter
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## 🚀 Getting Started

### Development Mode

To run the application in development mode on macOS or Windows:

```bash
npm start
```

For enterprise labs that require self-signed SOTI certificates, launch with
certificate bypass enabled. Certificate bypass is disabled by default.

macOS/Linux:
```bash
SOTI_ALLOW_INSECURE_CERTS=1 npm start
```

Windows PowerShell:
```powershell
$env:SOTI_ALLOW_INSECURE_CERTS = "1"; npm start
```

Windows Command Prompt:
```cmd
set SOTI_ALLOW_INSECURE_CERTS=1 && npm start
```

### Building for Production

Build scripts are provided for macOS and Windows in the `build/` directory.

Build for the current platform:
```bash
npm run build
```

#### macOS
```bash
npm run build:mac
```

This creates a local `.app` bundle under `dist/Mac-Apple-Silicon/` or
`dist/Mac-Intel/`. The legacy electron-builder installer flow is still
available with unsigned local artifacts:

```bash
npm run build:mac:installer
```

#### Windows
```bash
npm run build:win
```

This creates a Windows x64 NSIS installer in the `dist/` folder. For a faster
unpacked Windows smoke build, run:

```bash
npm run build:win:dir
```

CI uploads generated `dist/` folders as build artifacts. Generated installers
and app bundles are intentionally not committed to this repository.

## 📖 Documentation

- [Custom Data API Overview](SOTI_CustomData_API_Documentation.md) - Technical details on SOTI Custom Data APIs.
- [Group Upload Analysis](CustomData_Group_Upload_Analysis.md) - Detailed analysis of device group data population.
- [Build Instructions](build/README.md) - Detailed guide for building on different platforms.

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This tool is not officially affiliated with SOTI Inc. Always test your custom data imports in a staging environment before applying them to production device groups.
