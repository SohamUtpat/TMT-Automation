import { test as base, type BrowserContext, type Page } from '@playwright/test';
import path from 'path';
import { ChangeLanguagePage } from '../pages/ChangeLanguagePage';

const authFile = path.join(__dirname, '../../playwright/.auth/admin.json');

type ChangeLanguageFixtures = {
  changeLanguagePage: ChangeLanguagePage;
};

type WorkerFixtures = {
  workerContext: BrowserContext;
  workerPage: Page;
};

export const test = base.extend<ChangeLanguageFixtures, WorkerFixtures>({
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
      const changeLanguagePage = new ChangeLanguagePage(page);
      await changeLanguagePage.ensureDashboardReady();
      await use(page);
    },
    { scope: 'worker' },
  ],

  page: async ({ workerPage }, use) => {
    await use(workerPage);
  },

  changeLanguagePage: async ({ workerPage }, use) => {
    const changeLanguagePage = new ChangeLanguagePage(workerPage);
    await changeLanguagePage.ensureDashboardReady();
    await use(changeLanguagePage);
    await changeLanguagePage.resetAfterTest();
  },
});

export { expect } from '@playwright/test';
