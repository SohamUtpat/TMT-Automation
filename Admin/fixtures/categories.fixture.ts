import { test as base, type BrowserContext, type Page } from '@playwright/test';
import path from 'path';
import { CategoriesPage } from '../pages/CategoriesPage';

const authFile = path.join(__dirname, '../../playwright/.auth/admin.json');

type CategoriesFixtures = {
  categoriesPage: CategoriesPage;
};

type WorkerFixtures = {
  workerContext: BrowserContext;
  workerPage: Page;
};

export const test = base.extend<CategoriesFixtures, WorkerFixtures>({
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
      const categoriesPage = new CategoriesPage(page);
      await categoriesPage.navigateToCategories();
      await use(page);
    },
    { scope: 'worker' },
  ],

  page: async ({ workerPage }, use) => {
    await use(workerPage);
  },

  categoriesPage: async ({ workerPage }, use) => {
    const categoriesPage = new CategoriesPage(workerPage);
    await categoriesPage.ensureCategoriesReady();
    await use(categoriesPage);
    await categoriesPage.resetAfterTest();
  },
});

export { expect } from '@playwright/test';
