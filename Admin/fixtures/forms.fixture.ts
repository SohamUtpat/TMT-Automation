import { test as base, type BrowserContext, type Page } from '@playwright/test';
import path from 'path';
import { FormsPage } from '../pages/FormsPage';

const authFile = path.join(__dirname, '../../playwright/.auth/admin.json');

type FormsFixtures = {
  formsPage: FormsPage;
};

type WorkerFixtures = {
  workerContext: BrowserContext;
  workerPage: Page;
};

export const test = base.extend<FormsFixtures, WorkerFixtures>({
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
      const formsPage = new FormsPage(page);
      await formsPage.navigateToForms();
      await use(page);
    },
    { scope: 'worker' },
  ],

  page: async ({ workerPage }, use) => {
    await use(workerPage);
  },

  formsPage: async ({ workerPage }, use) => {
    const formsPage = new FormsPage(workerPage);
    await formsPage.ensureFormsReady();
    await use(formsPage);
    await formsPage.resetAfterTest();
  },
});

export { expect } from '@playwright/test';
