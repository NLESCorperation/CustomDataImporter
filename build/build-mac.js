#!/usr/bin/env node

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const productName = packageJson.build?.productName || 'SOTI Custom Data Importer';
const appId = packageJson.build?.appId || 'com.soti.customdataimporter';
const version = packageJson.version || '0.0.0';
const electronApp = path.join(rootDir, 'node_modules', 'electron', 'dist', 'Electron.app');
const outputDir = path.join(rootDir, 'dist', process.arch === 'arm64' ? 'Mac-Apple-Silicon' : 'Mac-Intel');
const appOut = path.join(outputDir, `${productName}.app`);
const resourcesDir = path.join(appOut, 'Contents', 'Resources');
const bundledAppDir = path.join(resourcesDir, 'app');

function copyIntoApp(relativePath) {
    fs.cpSync(path.join(rootDir, relativePath), path.join(bundledAppDir, relativePath), {
        recursive: true,
        dereference: true,
        filter: source => !source.includes(`${path.sep}.DS_Store`)
    });
}

function plistBuddy(...commands) {
    for (const command of commands) {
        try {
            execFileSync('/usr/libexec/PlistBuddy', ['-c', command, path.join(appOut, 'Contents', 'Info.plist')], {
                stdio: command.startsWith('Delete ') ? 'ignore' : 'inherit'
            });
        } catch (error) {
            if (!command.startsWith('Delete ')) throw error;
        }
    }
}

function clearCodeSignXattrs(target) {
    const script = `
        find "$APP_TARGET" \\( -name '*.app' -o -name '*.framework' \\) -exec xattr -d com.apple.FinderInfo {} \\; 2>/dev/null || true
        find "$APP_TARGET" \\( -name '*.app' -o -name '*.framework' \\) -exec xattr -d 'com.apple.fileprovider.fpfs#P' {} \\; 2>/dev/null || true
        find "$APP_TARGET" -exec xattr -d com.apple.ResourceFork {} \\; 2>/dev/null || true
        xattr -d com.apple.FinderInfo "$APP_TARGET" 2>/dev/null || true
        xattr -d 'com.apple.fileprovider.fpfs#P' "$APP_TARGET" 2>/dev/null || true
    `;
    execFileSync('/bin/zsh', ['-lc', script], {
        env: { ...process.env, APP_TARGET: target },
        stdio: 'ignore'
    });
}

if (!fs.existsSync(electronApp)) {
    throw new Error('Electron runtime is missing. Run npm install first.');
}

fs.rmSync(appOut, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });
execFileSync('ditto', ['--norsrc', '--noextattr', electronApp, appOut], { stdio: 'inherit' });

const electronBinary = path.join(appOut, 'Contents', 'MacOS', 'Electron');
const appBinary = path.join(appOut, 'Contents', 'MacOS', productName);
if (fs.existsSync(electronBinary)) {
    fs.renameSync(electronBinary, appBinary);
}

fs.rmSync(path.join(resourcesDir, 'default_app.asar'), { force: true });
fs.mkdirSync(bundledAppDir, { recursive: true });

copyIntoApp('main.js');
copyIntoApp('preload.js');
copyIntoApp('src');
fs.writeFileSync(path.join(bundledAppDir, 'package.json'), JSON.stringify({
    name: packageJson.name,
    productName,
    version,
    description: packageJson.description,
    main: 'main.js'
}, null, 2));

plistBuddy(
    `Set :CFBundleDisplayName ${productName}`,
    `Set :CFBundleExecutable ${productName}`,
    `Set :CFBundleIdentifier ${appId}`,
    `Set :CFBundleName ${productName}`,
    `Set :CFBundleShortVersionString ${version}`,
    `Set :CFBundleVersion ${version}`,
    'Set :LSApplicationCategoryType public.app-category.utilities',
    'Delete :ElectronAsarIntegrity'
);

try {
    execFileSync('xattr', ['-cr', appOut], { stdio: 'ignore' });
    clearCodeSignXattrs(appOut);
    execFileSync('codesign', ['--force', '--deep', '--sign', '-', appOut], {
        stdio: 'inherit',
        timeout: 120000
    });
} catch (error) {
    try {
        clearCodeSignXattrs(appOut);
        execFileSync('codesign', ['--force', '--deep', '--sign', '-', appOut], {
            stdio: 'inherit',
            timeout: 120000
        });
    } catch (retryError) {
        console.warn(`codesign skipped: ${retryError.message}`);
    }
}

console.log(`Built ${appOut}`);
