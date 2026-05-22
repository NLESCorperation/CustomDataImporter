const { test, expect } = require('@playwright/test');
const { ApplicationPage } = require('../page-objects/ApplicationPage');

test.describe('Critical User Flows', () => {
    let appPage;
    let page;

    test.beforeEach(async () => {
        appPage = new ApplicationPage();
        page = await appPage.launch();
    });

    test.afterEach(async () => {
        await appPage.close();
    });

    test('User can connect and view device groups', async () => {
        // Mock the Network Requests to avoid hitting real SOTI
        await page.route('**/MobiControl/api/devicegroups**', async route => {
            const method = route.request().method();
            if (method === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify([
                        { ReferenceId: 'G1', Name: 'Test Group', Path: '\\Test Group', children: [] }
                    ])
                });
            } else {
                await route.continue();
            }
        });

        // Mock token endpoint
        await page.route('**/MobiControl/api/token', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ access_token: 'mock-token', token_type: 'Bearer' })
            });
        });

        // 1. Connect
        await appPage.connectToServer('https://mock-server');

        // 2. Verify Group List
        const groupItem = page.locator('.group-item').first();
        await expect(groupItem).toBeVisible();
        await expect(groupItem).toContainText('Test Group');
    });

    test('Selecting a group shows "Current Group Data" (Mocked Data)', async () => {
        // Mock token
        await page.route('**/MobiControl/api/token', async route => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify({ access_token: 'mock-token', token_type: 'Bearer' })
            });
        });

        // Mock Group list
        await page.route('**/MobiControl/api/devicegroups**', async route => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify([{ ReferenceId: 'G1', Name: 'Target Group', Path: '\\Target Group' }])
            });
        });

        await page.route('**/customData', async route => {
            await route.fulfill({ status: 200, body: JSON.stringify([{ Name: 'AssetTag', Value: '12345' }]) });
        });

        await appPage.connectToServer('https://mock-server');
        await appPage.selectGroup('Target Group');

        const tableText = await appPage.verifyGroupInfoLoaded();
        expect(tableText).toContain('AssetTag');

        // UX Check: Ensure no "undefined" text leaked
        expect(tableText).not.toContain('undefined');
    });

    test('Applying Custom Data shows success toast', async () => {
        // Mock token
        await page.route('**/MobiControl/api/token', async route => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify({ access_token: 'mock-token', token_type: 'Bearer' })
            });
        });

        // Mock groups
        await page.route('**/MobiControl/api/devicegroups**', async route => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify([{ ReferenceId: 'G1', Name: 'Target Group', Path: '\\Target Group' }])
            });
        });

        // Mock API for applying data
        await page.route('**/MobiControl/api/devicegroups/**/customData/**', async route => {
            if (route.request().method() === 'PUT') {
                await route.fulfill({ status: 200 });
            } else {
                await route.continue();
            }
        });

        await appPage.connectToServer('https://mock-server');
        await appPage.selectGroup('Target Group');

        // Navigate to Manual Entry tab and add a property
        await page.click('[data-tab="manual"]');
        await page.fill('#prop-name', 'NewProp');
        await page.fill('#ini-file', '/sdcard/Download/customdata.ini');
        await page.fill('#ini-section', 'Settings');
        await page.fill('#ini-val-name', 'TestKey');
        await page.click('#add-manual-btn');

        // Navigate to List tab and Apply
        await page.click('[data-tab="list"]');
        await page.click('#apply-btn');

        // Verify Success Toast or Feedback
        await expect(page.locator('.toast')).toBeVisible({ timeout: 5000 });
    });
});
