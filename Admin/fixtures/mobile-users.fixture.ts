import { test as base, type BrowserContext, type Page } from '@playwright/test';
import path from 'path';
import { MobileUsersPage } from '../pages/MobileUsersPage';

const authFile = path.join(__dirname, '../../playwright/.auth/admin.json');

type MobileUsersFixtures = {
  mobileUsersPage: MobileUsersPage;
};

type WorkerFixtures = {
  workerContext: BrowserContext;
  workerPage: Page;
};

export const test = base.extend<MobileUsersFixtures, WorkerFixtures>({
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

  mobileUsersPage: async ({ workerPage }, use) => {
    const mobileUsersPage = new MobileUsersPage(workerPage);
    await mobileUsersPage.ensureListingReady();
    await use(mobileUsersPage);
    await mobileUsersPage.resetAfterTest();
  },
});

export { expect } from '@playwright/test';
