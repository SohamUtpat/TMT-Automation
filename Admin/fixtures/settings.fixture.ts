import { test as base, expect, type BrowserContext, type Page } from '@playwright/test';
import path from 'path';
import { SettingsPage, type ApiSettings } from '../pages/SettingsPage';

const authFile = path.join(__dirname, '../../playwright/.auth/admin.json');

type SettingsFixtures = {
  settingsPage: SettingsPage;
  settingsBaseline: ApiSettings;
};

type WorkerFixtures = {
  workerBaseline: ApiSettings;
  workerContext: BrowserContext;
  workerPage: Page;
};

export const test = base.extend<SettingsFixtures, WorkerFixtures>({
  workerBaseline: [
    async ({ browser }, use) => {
      const context = await browser.newContext({ storageState: authFile });
      const page = await context.newPage();
      const settingsPage = new SettingsPage(page);
      await settingsPage.navigateToSettings();
      const baseline = await settingsPage.fetchSettingsFromApi();
      await context.close();
      await use(baseline);
    },
    { scope: 'worker' },
  ],

  workerContext: [
    async ({ browser }, use) => {
      const context = await browser.newContext({ storageState: authFile });
      await use(context);
      await context.close();
    },
    { scope: 'worker' },
  ],

  workerPage: [
    async ({ workerContext }, use) => {
      const page = await workerContext.newPage();
      await use(page);
    },
    { scope: 'worker' },
  ],

  page: async ({ workerPage }, use) => {
    await use(workerPage);
  },

  settingsBaseline: async ({ workerBaseline }, use) => {
    await use(workerBaseline);
  },

  settingsPage: async ({ workerPage, settingsBaseline }, use) => {
    const settingsPage = new SettingsPage(workerPage);
    await settingsPage.ensureSettingsReady();
    await use(settingsPage);
    await settingsPage.resetAfterTest(settingsBaseline);
  },
});

export { expect } from '@playwright/test';
