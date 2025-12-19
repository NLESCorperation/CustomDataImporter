#!/bin/bash
# Build script for all platforms (cross-platform build)
# Run this script from the project root: ./build/build-all.sh
# Note: Cross-compilation requires proper setup on the host machine

set -e

echo "================================================"
echo "  SOTI Custom Data Importer - Full Build"
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
echo "🔨 Building for all platforms..."

# Detect current platform
case "$(uname -s)" in
    Darwin)
        echo "🍎 Building macOS..."
        npm run build:mac
        
        echo ""
        echo "🪟 Building Windows (requires Wine on macOS)..."
        npm run build:win || echo "⚠️  Windows build skipped (Wine not installed)"
        ;;
    Linux)
        echo "🐧 Building Linux..."
        npm run build:linux
        
        echo ""
        echo "🪟 Building Windows..."
        npm run build:win || echo "⚠️  Windows build failed"
        ;;
    MINGW*|CYGWIN*|MSYS*)
        echo "🪟 Building Windows..."
        npm run build:win
        ;;
    *)
        echo "❌ Unknown platform: $(uname -s)"
        exit 1
        ;;
esac

echo ""
echo "✅ Build complete!"
echo "📁 Output location: dist/"

