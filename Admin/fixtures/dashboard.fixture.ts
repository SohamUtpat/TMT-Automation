import { test as base, type BrowserContext, type Page } from '@playwright/test';
import path from 'path';
import { DashboardPage } from '../pages/DashboardPage';

const authFile = path.join(__dirname, '../../playwright/.auth/admin.json');

type DashboardFixtures = {
  dashboardPage: DashboardPage;
};

type WorkerFixtures = {
  workerContext: BrowserContext;
  workerPage: Page;
};

export const test = base.extend<DashboardFixtures, WorkerFixtures>({
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
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.navigateToDashboard();
      await use(page);
    },
    { scope: 'worker' },
  ],

  page: async ({ workerPage }, use) => {
    await use(workerPage);
  },

  dashboardPage: async ({ workerPage }, use) => {
    const dashboardPage = new DashboardPage(workerPage);

    if (!/\/dashboard(?:\/|$|\?)/.test(workerPage.url())) {
      await dashboardPage.navigateToDashboard();
    }

    await use(dashboardPage);
  },
});

export { expect } from '@playwright/test';
