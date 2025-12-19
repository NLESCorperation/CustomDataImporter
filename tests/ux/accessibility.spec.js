const { test, expect } = require('@playwright/test');
const { ApplicationPage } = require('../page-objects/ApplicationPage');
const { AxeBuilder } = require('@axe-core/playwright');

test.describe('UX & Accessibility Quality Gate', () => {
    let appPage;
    let page;

    test.beforeEach(async () => {
        appPage = new ApplicationPage();
        page = await appPage.launch();

        // Setup Mock Environment for consistent UX scanning
        await page.route('**/MobiControl/api/devicegroups**', async route => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify([{ ReferenceId: 'G1', Name: 'UX Test Group', Path: '\\UX Test Group' }])
            });
        });

        await appPage.connectToServer('https://ux-test.corp', 'ux-token');
    });

    test.afterEach(async () => {
        await appPage.close();
    });

    test('Main Application Screen should not have critical accessibility violations', async () => {
        // Analyze the page with Axe
        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
            .analyze();

        // Fail if there are violations
        expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('Current Group Data tab should match visual snapshot', async () => {
        await appPage.selectGroup('UX Test Group');
        await page.click('[data-tab="group-info"]');

        // Wait for animation/render
        await page.waitForTimeout(500);

        // Visual Regression Check
        // This will generate a baseline on first run, and compare on subsequent runs
        await expect(page).toHaveScreenshot('group-info-tab.png', { maxDiffPixelRatio: 0.01 });
    });
});
