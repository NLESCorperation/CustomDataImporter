const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..', '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
const indexHtml = fs.readFileSync(path.join(rootDir, 'src', 'index.html'), 'utf8');
const domModule = fs.readFileSync(path.join(rootDir, 'src', 'modules', 'dom.js'), 'utf8');
const renderer = fs.readFileSync(path.join(rootDir, 'src', 'renderer.js'), 'utf8');
const mainProcess = fs.readFileSync(path.join(rootDir, 'main.js'), 'utf8');
const apiModule = fs.readFileSync(path.join(rootDir, 'src', 'modules', 'api.js'), 'utf8');
const browserCompat = fs.readFileSync(path.join(rootDir, 'src', 'modules', 'browser-compat.js'), 'utf8');
const buildCurrent = fs.readFileSync(path.join(rootDir, 'build', 'build-current.js'), 'utf8');

function htmlHasId(id) {
    return new RegExp(`id=["']${id}["']`).test(indexHtml);
}

describe('static application smoke checks', () => {
    it('all cached DOM ids referenced by dom.js exist in index.html', () => {
        const ids = [...domModule.matchAll(/document\.getElementById\('([^']+)'\)/g)].map(match => match[1]);
        const missing = ids.filter(id => !htmlHasId(id));
        assert.deepStrictEqual(missing, []);
    });

    it('tab buttons have matching tab panels', () => {
        const tabIds = [...indexHtml.matchAll(/data-tab=["']([^"']+)["']/g)].map(match => match[1]);
        const missingPanels = tabIds.filter(id => !htmlHasId(id));
        assert.deepStrictEqual(missingPanels, []);
    });

    it('browser compatibility shim loads before the module renderer', () => {
        const compatIndex = indexHtml.indexOf('modules/browser-compat.js');
        const rendererIndex = indexHtml.indexOf('renderer.js');
        assert.ok(compatIndex > -1, 'browser compatibility shim is missing');
        assert.ok(rendererIndex > compatIndex, 'renderer should load after browser compatibility shim');
    });

    it('renderer initializes every major workflow module', () => {
        [
            'initTabs',
            'initTheme',
            'initSidebar',
            'initProfiles',
            'initGroups',
            'initApply',
            'initPredefined',
            'initXsight',
            'initManualEntry'
        ].forEach(initName => {
            assert.ok(renderer.includes(`${initName}(`), `${initName} is not initialized`);
        });
    });

    it('main process does not depend on native keytar bindings', () => {
        assert.ok(!/require\(['"]keytar['"]\)/.test(mainProcess));
        assert.ok(mainProcess.includes('safeStorage'), 'credentials should use Electron safeStorage');
    });

    it('build scripts support current-platform and Windows x64 builds', () => {
        assert.strictEqual(packageJson.scripts.build, 'node build/build-current.js');
        assert.ok(packageJson.scripts['build:win'].includes('--win --x64'), 'Windows installer builds should target x64 explicitly');
        assert.ok(packageJson.scripts['build:win:dir'].includes('--win --x64 --dir'), 'Windows smoke builds should target x64 explicitly');
        assert.ok(buildCurrent.includes("darwin: 'build:mac'"), 'current-platform builds should support macOS');
        assert.ok(buildCurrent.includes("win32: 'build:win'"), 'current-platform builds should support Windows');
    });

    it('native window integration is platform-gated for macOS and Windows', () => {
        assert.ok(mainProcess.includes("if (process.platform === 'darwin')"), 'macOS chrome options should be platform-gated');
        assert.ok(mainProcess.includes("options.titleBarStyle = 'hiddenInset'"), 'macOS hidden titlebar should remain enabled on macOS');
        assert.ok(mainProcess.includes("options.trafficLightPosition = { x: 15, y: 15 }"), 'macOS traffic lights should remain positioned on macOS');
        assert.ok(mainProcess.includes("if (process.platform === 'win32')"), 'Windows integration should be platform-gated');
        assert.ok(mainProcess.includes('app.setAppUserModelId(APP_ID)'), 'Windows AppUserModelId should be configured');
    });

    it('platform icon assets exist for packaged builds', () => {
        const iconFiles = [
            ['build/icon.png', Buffer.from([0x89, 0x50, 0x4e, 0x47])],
            ['build/icon.ico', Buffer.from([0x00, 0x00, 0x01, 0x00])],
            ['build/icon.icns', Buffer.from('icns')]
        ];

        for (const [relativePath, signature] of iconFiles) {
            const iconPath = path.join(rootDir, relativePath);
            assert.ok(fs.existsSync(iconPath), `${relativePath} should exist`);
            const content = fs.readFileSync(iconPath);
            assert.ok(content.subarray(0, signature.length).equals(signature), `${relativePath} should have a valid signature`);
        }
    });

    it('CustomData definitions can be deleted through the API boundary', () => {
        assert.ok(apiModule.includes('deleteCustomDataDefinition'), 'renderer API helper should expose CustomData definition deletion');
        assert.ok(apiModule.includes('/MobiControl/api/customdata/${encodeURIComponent(identifier)}'), 'delete helper should target the CustomData definition endpoint');
        assert.ok(mainProcess.includes("normalizedMethod === 'DELETE'"), 'Electron mock API should support DELETE smoke flows');
        assert.ok(browserCompat.includes("String(method).toUpperCase() === 'DELETE'"), 'browser mock API should support DELETE smoke flows');
    });
});
