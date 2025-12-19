# SOTI Custom Data Importer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A cross-platform Electron application for importing and managing Custom Data in SOTI MobiControl. This tool simplifies the process of creating Custom Data definitions and populating them across device groups.

## 🚀 Features

- **Cross-Platform**: Runs on macOS and Windows.
- **Easy Import**: Import custom data definitions from CSV or JSON (if implemented, otherwise mention current capability).
- **Group Management**: Select and apply custom data to specific device groups in SOTI MobiControl.
- **Modern UI**: Clean, responsive interface built with HTML/CSS and Electron.
- **Secure**: Handles SOTI API authentication securely.

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

To run the application in development mode with hot-reloading:

```bash
npm start
```

### Building for Production

Build scripts are provided for macOS and Windows in the `build/` directory.

#### macOS
```bash
npm run build:mac
```

#### Windows
```bash
npm run build:win
```

The distributables will be available in the `dist/` folder.

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
