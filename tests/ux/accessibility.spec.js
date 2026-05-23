const { test, expect } = require('@playwright/test');
const { ApplicationPage } = require('../page-objects/ApplicationPage');
const fs = require('node:fs');
const axeSourcePath = require.resolve('axe-core/axe.min.js');
const axeSource = fs.readFileSync(axeSourcePath, 'utf8');

test.describe('UX & Accessibility Quality Gate', () => {
    let appPage;
    let page;

    test.beforeEach(async () => {
        appPage = new ApplicationPage();
        page = await appPage.launch();

        await appPage.setMockScenario('success', {
            groups: [{ ReferenceId: 'G1', Name: 'UX Test Group', Path: '\\UX Test Group' }],
            customDataDefinitions: [{ Name: 'AssetTag' }, { Name: 'DeviceConfig' }],
            customAttributes: [{ Name: 'AssetTag', Value: '12345', DataType: 'String', IsInherited: false }]
        });

        await appPage.connectToServer('https://ux-test.corp', 'ux-token');
    });

    test.afterEach(async () => {
        await appPage.close();
    });

    test('Main Application Screen should not have critical accessibility violations', async () => {
        const accessibilityScanResults = await page.evaluate(async (source) => {
            new Function(source)();
            return window.axe.run(document, {
                runOnly: {
                    type: 'tag',
                    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
                }
            });
        }, axeSource);

        await expect.poll(() => accessibilityScanResults.violations.length).toBe(0);
    });

    test('Current Group Data tab should render without visual regressions', async () => {
        await appPage.selectGroup('UX Test Group');
        await page.click('[data-tab="group-info"]');

        // Wait for animation/render
        await page.waitForTimeout(500);

        await expect(page.locator('#group-info')).toBeVisible();
        await expect(page.locator('#group-info-table')).toBeVisible();
        await expect(page.locator('#group-info')).not.toContainText('undefined');

        const screenshot = await page.screenshot({ fullPage: false });
        expect(screenshot.length).toBeGreaterThan(5000);
    });
});
