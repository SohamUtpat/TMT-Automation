import { test as base, type BrowserContext, type Page } from '@playwright/test';
import path from 'path';
import { AdminUsersPage } from '../pages/AdminUsersPage';

const authFile = path.join(__dirname, '../../playwright/.auth/admin.json');

type AdminUsersFixtures = {
  adminUsersPage: AdminUsersPage;
};

type WorkerFixtures = {
  workerContext: BrowserContext;
  workerPage: Page;
};

export const test = base.extend<AdminUsersFixtures, WorkerFixtures>({
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

  adminUsersPage: async ({ workerPage }, use) => {
    const adminUsersPage = new AdminUsersPage(workerPage);
    await adminUsersPage.ensureListingReady();
    await use(adminUsersPage);
    await adminUsersPage.resetAfterTest();
  },
});

export { expect } from '@playwright/test';
