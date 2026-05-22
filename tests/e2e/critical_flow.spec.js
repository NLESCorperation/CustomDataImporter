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
        await appPage.setMockScenario('success', {
            groups: [{ ReferenceId: 'G1', Name: 'Test Group', Path: '\\Test Group', children: [] }]
        });

        // 1. Connect
        await appPage.connectToServer('https://mock-server');

        // 2. Verify Group List
        const groupItem = page.locator('.group-item').first();
        await expect(groupItem).toBeVisible();
        await expect(groupItem).toContainText('Test Group');
    });

    test('Selecting a group shows "Current Group Data" (Mocked Data)', async () => {
        await appPage.setMockScenario('success', {
            groups: [{ ReferenceId: 'G1', Name: 'Target Group', Path: '\\Target Group' }],
            customDataDefinitions: [{ Name: 'AssetTag' }],
            customAttributes: [{ Name: 'AssetTag', Value: '12345', DataType: 'String', IsInherited: false }]
        });

        await appPage.connectToServer('https://mock-server');
        await appPage.selectGroup('Target Group');

        const tableText = await appPage.verifyGroupInfoLoaded();
        expect(tableText).toContain('AssetTag');

        // UX Check: Ensure no "undefined" text leaked
        expect(tableText).not.toContain('undefined');
    });

    test('Applying Custom Data shows success toast', async () => {
        await appPage.setMockScenario('success', {
            groups: [{ ReferenceId: 'G1', Name: 'Target Group', Path: '\\Target Group' }]
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
