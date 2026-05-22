const { describe, it } = require('node:test');
const assert = require('node:assert');

// Reimplement validateServerUrl from main.js for unit testing
function validateServerUrl(urlStr) {
    try {
        const parsed = new URL(urlStr);
        if (parsed.protocol !== 'https:') {
            return { valid: false, error: 'Server URL must use HTTPS' };
        }
        if (parsed.username || parsed.password) {
            return { valid: false, error: 'Server URL must not contain embedded credentials' };
        }
        if (parsed.hash) {
            return { valid: false, error: 'Server URL must not contain a fragment' };
        }
        return { valid: true };
    } catch {
        return { valid: false, error: 'Invalid server URL format' };
    }
}

describe('validateServerUrl', () => {
    it('should accept valid HTTPS URLs', () => {
        assert.deepStrictEqual(validateServerUrl('https://example.mobicontrol.cloud'), { valid: true });
        assert.deepStrictEqual(validateServerUrl('https://server.com/path'), { valid: true });
    });

    it('should reject HTTP URLs', () => {
        const result = validateServerUrl('http://example.com');
        assert.strictEqual(result.valid, false);
        assert.ok(result.error.includes('HTTPS'));
    });

    it('should reject URLs with embedded credentials', () => {
        const result = validateServerUrl('https://user:pass@example.com');
        assert.strictEqual(result.valid, false);
        assert.ok(result.error.includes('credentials'));
    });

    it('should reject URLs with fragments', () => {
        const result = validateServerUrl('https://example.com#section');
        assert.strictEqual(result.valid, false);
        assert.ok(result.error.includes('fragment'));
    });

    it('should reject invalid URLs', () => {
        const result = validateServerUrl('not-a-url');
        assert.strictEqual(result.valid, false);
    });
});
