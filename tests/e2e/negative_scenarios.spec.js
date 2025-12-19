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

    test('Invalid Credentials shows error shake/toast', async () => {
        // Mock 401 response
        await page.route('**/MobiControl/api/devicegroups**', async route => {
            await route.fulfill({ status: 401 });
        });

        await page.getByPlaceholder('https://mobi.corp.com').fill('https://bad.url');
        await page.getByPlaceholder('Refresh Token').fill('bad-token');
        await page.getByRole('button', { name: 'Connect' }).click();

        // Expect Error Toast
        const toast = page.locator('.toast-error').or(page.locator('text=Failed to load groups'));
        await expect(toast).toBeVisible();

        // UX Check: Ensure main interface is NOT unlocked (Group list still empty/hidden)
        await expect(page.locator('.group-item')).toHaveCount(0);
    });

    test('API 500 Error during Group Load is handled gracefully', async () => {
        await page.route('**/MobiControl/api/devicegroups**', async route => {
            await route.fulfill({ status: 500, body: 'Internal Server Error' });
        });

        await appPage.connectToServer('https://server.com', 'token');

        // Should show specific error message, not crash
        await expect(page.locator('text=Internal Server Error')).toBeVisible();
        // App should remain responsive (Buttons still clickable)
        await expect(page.getByRole('button', { name: 'Connect' })).toBeEnabled();
    });
});
