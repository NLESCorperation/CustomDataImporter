#!/bin/bash
# Build script for macOS
# Run this script from the project root: ./build/build-mac.sh

set -e

echo "================================================"
echo "  SOTI Custom Data Importer - macOS Build"
echo "================================================"
echo ""

# Navigate to project root
cd "$(dirname "$0")/.."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔨 Building macOS application..."
npm run build:mac

echo ""
echo "✅ Build complete!"
echo "📁 Output location: dist/"
echo ""
echo "The .dmg installer is ready for distribution."

