const { describe, it } = require('node:test');
const assert = require('node:assert');

// Since utils.js uses ES modules & DOM, we test the pure logic patterns here
// by reimplementing the same functions for unit testing

function fixServerUrl(url) {
    if (!url) return url;
    let fixed = url.trim();
    fixed = fixed.replace(/\/+$/, '');
    if (!fixed.match(/^https?:\/\//i)) {
        fixed = fixed.replace(/^https?:?\/?/i, '');
        fixed = 'https://' + fixed;
    }
    if (fixed.toLowerCase().startsWith('http://')) {
        fixed = 'https://' + fixed.substring(7);
    }
    return fixed;
}

function toPascalCase(str) {
    if (!str) return 'String';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function formatKeyForDisplay(key) {
    return key.replace(/([a-z])([A-Z])/g, '$1 $2');
}

describe('fixServerUrl', () => {
    it('should add https:// when no protocol present', () => {
        assert.strictEqual(fixServerUrl('example.mobicontrol.cloud'), 'https://example.mobicontrol.cloud');
    });

    it('should convert http:// to https://', () => {
        assert.strictEqual(fixServerUrl('http://example.com'), 'https://example.com');
    });

    it('should remove trailing slashes', () => {
        assert.strictEqual(fixServerUrl('https://example.com///'), 'https://example.com');
    });

    it('should handle already correct URLs', () => {
        assert.strictEqual(fixServerUrl('https://example.com'), 'https://example.com');
    });

    it('should return empty/falsy values unchanged', () => {
        assert.strictEqual(fixServerUrl(''), '');
        assert.strictEqual(fixServerUrl(null), null);
        assert.strictEqual(fixServerUrl(undefined), undefined);
    });

    it('should trim whitespace', () => {
        assert.strictEqual(fixServerUrl('  https://example.com  '), 'https://example.com');
    });
});

describe('toPascalCase', () => {
    it('should capitalize first letter and lowercase rest', () => {
        assert.strictEqual(toPascalCase('string'), 'String');
        assert.strictEqual(toPascalCase('INTEGER'), 'Integer');
    });

    it('should return "String" for empty/falsy input', () => {
        assert.strictEqual(toPascalCase(''), 'String');
        assert.strictEqual(toPascalCase(null), 'String');
        assert.strictEqual(toPascalCase(undefined), 'String');
    });
});

describe('formatKeyForDisplay', () => {
    it('should insert space before uppercase letters', () => {
        assert.strictEqual(formatKeyForDisplay('batteryCapacity'), 'battery Capacity');
        assert.strictEqual(formatKeyForDisplay('deviceId'), 'device Id');
    });

    it('should not modify already spaced strings', () => {
        assert.strictEqual(formatKeyForDisplay('hello world'), 'hello world');
    });

    it('should handle consecutive capitals', () => {
        assert.strictEqual(formatKeyForDisplay('getHTTPResponse'), 'get HTTPResponse');
    });
});
