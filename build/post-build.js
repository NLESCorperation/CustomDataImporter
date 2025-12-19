#!/usr/bin/env node
/**
 * Post-build script to rename build outputs with clear names
 * Run after: npm run build:mac or npm run build:win
 */

const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');

if (!fs.existsSync(distDir)) {
    console.log('No dist folder found. Run a build first.');
    process.exit(0);
}

// Folder renames
const folderRenames = [
    { from: 'mac', to: 'Mac-Intel' },
    { from: 'mac-arm64', to: 'Mac-Apple-Silicon' },
    { from: 'win-unpacked', to: 'Windows' }
];

console.log('📦 Renaming build outputs...\n');

for (const { from, to } of folderRenames) {
    const fromPath = path.join(distDir, from);
    const toPath = path.join(distDir, to);
    
    if (fs.existsSync(fromPath)) {
        // Remove old target if exists
        if (fs.existsSync(toPath)) {
            fs.rmSync(toPath, { recursive: true });
            console.log(`   Removed existing: ${to}`);
        }
        
        fs.renameSync(fromPath, toPath);
        console.log(`✅ ${from} → ${to}`);
    }
}

// File renames (DMG and EXE)
const fileRenames = [
    { pattern: /-x64\.dmg$/, replacement: '-Intel.dmg' },
    { pattern: /-arm64\.dmg$/, replacement: '-Apple-Silicon.dmg' },
    { pattern: /-win-x64\.exe$/, replacement: '-Windows.exe' }
];

const files = fs.readdirSync(distDir);
for (const file of files) {
    for (const { pattern, replacement } of fileRenames) {
        if (pattern.test(file)) {
            const oldPath = path.join(distDir, file);
            const newFile = file.replace(pattern, replacement);
            const newPath = path.join(distDir, newFile);
            
            if (fs.existsSync(newPath)) {
                fs.rmSync(newPath);
            }
            
            fs.renameSync(oldPath, newPath);
            console.log(`✅ ${file} → ${newFile}`);
            
            // Also rename blockmap if exists
            const blockmapOld = oldPath + '.blockmap';
            const blockmapNew = newPath + '.blockmap';
            if (fs.existsSync(blockmapOld)) {
                if (fs.existsSync(blockmapNew)) fs.rmSync(blockmapNew);
                fs.renameSync(blockmapOld, blockmapNew);
            }
        }
    }
}

// Clean up unnecessary files
const cleanupPatterns = ['*.blockmap', 'builder-debug.yml', 'builder-effective-config.yaml'];
for (const pattern of cleanupPatterns) {
    const files = fs.readdirSync(distDir).filter(f => {
        if (pattern.startsWith('*')) {
            return f.endsWith(pattern.slice(1));
        }
        return f === pattern;
    });
    for (const file of files) {
        const filePath = path.join(distDir, file);
        fs.rmSync(filePath);
        console.log(`🧹 Removed: ${file}`);
    }
}

console.log('\n✨ Done! Check the dist/ folder.');

