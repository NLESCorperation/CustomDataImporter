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

        // 1. Connect
        await appPage.connectToServer('https://mock-server', 'mock-token');

        // 2. Verify Group List
        const groupItem = page.locator('.group-item').first();
        await expect(groupItem).toBeVisible();
        await expect(groupItem).toContainText('Test Group');
    });

    test('Selecting a group shows "Current Group Data" (Mocked Data)', async () => {
        // Mock Group & Custom Data
        await page.route('**/MobiControl/api/devicegroups**', async route => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify([{ ReferenceId: 'G1', Name: 'Target Group', Path: '\\Target Group' }])
            });
        });

        await page.route('**/customData', async route => { // Matches /customData endpoint
            await route.fulfill({ status: 200, body: JSON.stringify([{ Name: 'AssetTag', Value: '12345' }]) });
        });

        await appPage.connectToServer('https://mock-server', 'mock-token');
        await appPage.selectGroup('Target Group');

        const tableText = await appPage.verifyGroupInfoLoaded();
        expect(tableText).toContain('AssetTag');
        expect(tableText).toContain('12345');

        // UX Check: Ensure no "undefined" text leaked
        expect(tableText).not.toContain('undefined');
    });

    test('Applying Custom Data shows success toast', async () => {
        // Mock API for applying data
        await page.route('**/MobiControl/api/devicegroups/**/customData/**', async route => {
            if (route.request().method() === 'PUT') {
                await route.fulfill({ status: 200 });
            } else {
                await route.continue();
            }
        });

        await appPage.connectToServer('https://mock-server', 'mock-token');
        await appPage.selectGroup('Target Group'); // Assuming previous mock setup persists or need re-mocking if isolated

        // Stage Data
        await page.getByPlaceholder('Property Name').fill('NewProp');
        await page.getByPlaceholder('Value').fill('NewVal');
        await page.getByRole('button', { name: 'Add to List' }).click();

        // Apply
        await page.getByRole('button', { name: 'Apply to Group' }).click();

        // Verify Success Toast or Feedback
        await expect(page.locator('.toast-success')).toBeVisible({ timeout: 5000 });
    });
});
