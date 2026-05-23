const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..', '..');
const indexHtml = fs.readFileSync(path.join(rootDir, 'src', 'index.html'), 'utf8');
const domModule = fs.readFileSync(path.join(rootDir, 'src', 'modules', 'dom.js'), 'utf8');
const renderer = fs.readFileSync(path.join(rootDir, 'src', 'renderer.js'), 'utf8');
const mainProcess = fs.readFileSync(path.join(rootDir, 'main.js'), 'utf8');

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

    it('main process does not eagerly load native keychain bindings', () => {
        assert.ok(!/const\s+keytar\s*=\s*require\(['"]keytar['"]\)/.test(mainProcess));
        assert.ok(mainProcess.includes('function getKeytar()'), 'keytar should be loaded lazily');
    });
});
