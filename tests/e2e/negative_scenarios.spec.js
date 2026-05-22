const { test, expect } = require('@playwright/test');
const { ApplicationPage } = require('../page-objects/ApplicationPage');

test.describe('Negative Scenarios', () => {
    let appPage;
    let page;

    test.beforeEach(async () => {
        appPage = new ApplicationPage();
        page = await appPage.launch();
    });

    test.afterEach(async () => {
        await appPage.close();
    });

    test('Invalid Credentials shows error toast', async () => {
        await appPage.setMockScenario('invalidCredentials');

        // Navigate to Server tab and fill fields
        await page.click('[data-tab="settings"]');
        await page.fill('#server-url', 'https://bad.url');
        await page.fill('#client-id', 'bad-id');
        await page.fill('#client-secret', 'bad-secret');
        await page.fill('#username', 'bad-user');
        await page.fill('#password', 'bad-pass');
        await page.click('#connect-btn');

        // Expect Error Toast
        const toast = page.locator('.toast');
        await expect(toast).toBeVisible({ timeout: 5000 });

        // UX Check: Ensure main interface is NOT unlocked (Group list still empty/hidden)
        await expect(page.locator('.group-item')).toHaveCount(0);
    });

    test('API 500 Error during Group Load is handled gracefully', async () => {
        await appPage.setMockScenario('groupError');

        // Navigate to Server tab and connect
        await page.click('[data-tab="settings"]');
        await page.fill('#server-url', 'https://server.com');
        await page.fill('#client-id', 'test-id');
        await page.fill('#client-secret', 'test-secret');
        await page.fill('#username', 'test-user');
        await page.fill('#password', 'test-pass');
        await page.click('#connect-btn');

        // Should show error toast, not crash
        const toast = page.locator('.toast');
        await expect(toast).toBeVisible({ timeout: 5000 });

        // App should remain responsive (Connect button re-enabled)
        await expect(page.locator('#connect-btn')).toBeEnabled({ timeout: 5000 });
    });
});
