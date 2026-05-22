const { _electron: electron } = require('@playwright/test');

class ApplicationPage {
    constructor() {
        this.app = null;
        this.page = null;
    }

    async launch() {
        this.app = await electron.launch({
            args: ['.'],
            env: {
                ...process.env,
                E2E_MOCK_API: '1'
            }
        });
        this.page = await this.app.firstWindow();
        await this.page.waitForLoadState('domcontentloaded');
        return this.page;
    }

    async close() {
        if (this.app) {
            await this.app.close();
        }
    }

    async navigateToServerTab() {
        await this.page.click('[data-tab="settings"]');
    }

    async setMockScenario(scenario, overrides = {}) {
        await this.page.evaluate(
            ({ scenarioName, mockOverrides }) => window.api.test.setMockScenario(scenarioName, mockOverrides),
            { scenarioName: scenario, mockOverrides: overrides }
        );
    }

    async connectToServer(url, clientId, clientSecret, username, password) {
        // Navigate to Server tab first
        await this.navigateToServerTab();

        await this.page.fill('#server-url', url);
        await this.page.fill('#client-id', clientId || 'mock-client-id');
        await this.page.fill('#client-secret', clientSecret || 'mock-client-secret');
        await this.page.fill('#username', username || 'mock-user');
        await this.page.fill('#password', password || 'mock-password');
        await this.page.click('#connect-btn');

        // Wait for group list to appear
        await this.page.waitForSelector('.group-item', { timeout: 10000 });
    }

    async selectGroup(groupName) {
        await this.page.getByText(groupName, { exact: true }).click();
        // Verification: wait for selection state
        await this.page.waitForSelector(`.group-item.selected:has-text("${groupName}")`);
    }

    async verifyGroupInfoLoaded() {
        // Check if the "Current Group Data" tab content is visible and not empty
        await this.page.click('[data-tab="group-info"]');
        const table = this.page.locator('.data-table');
        await table.waitFor({ state: 'visible' });
        const text = await table.textContent();
        return text;
    }
}

module.exports = { ApplicationPage };
