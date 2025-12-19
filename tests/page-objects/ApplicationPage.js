const { _electron: electron } = require('@playwright/test');

class ApplicationPage {
    constructor() {
        this.app = null;
        this.page = null;
    }

    async launch() {
        this.app = await electron.launch({ args: ['.'] });
        this.page = await this.app.firstWindow();
        await this.page.waitForLoadState('domcontentloaded');
        return this.page;
    }

    async close() {
        if (this.app) {
            await this.app.close();
        }
    }

    async connectToServer(url, token) {
        await this.page.getByPlaceholder('https://mobi.corp.com').fill(url);
        await this.page.getByPlaceholder('Refresh Token').fill(token);
        await this.page.getByRole('button', { name: 'Connect' }).click();
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
        // Expect at least one row or the 'No custom data' message, but not "undefined"
        const text = await table.textContent();
        return text;
    }
}

module.exports = { ApplicationPage };
