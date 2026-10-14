import { test as base, type BrowserContext, type Page } from '@playwright/test';
import { loginData } from '../data/loginData';
import { LoginPage } from '../pages/LoginPage';

type LoginFixtures = {
  loginPage: LoginPage;
};

type WorkerFixtures = {
  workerContext: BrowserContext;
  workerPage: Page;
};

export const test = base.extend<LoginFixtures, WorkerFixtures>({
  workerContext: [
    async ({ browser }, use) => {
      const context = await browser.newContext();
      // Product default is Japanese; pin English before any login page load.
      await context.addInitScript(
        ({ key, value }) => {
          try {
            localStorage.setItem(key, value);
          } catch {
            // Ignore storage access errors on restricted documents.
          }
        },
        {
          key: loginData.languageStorageKey,
          value: loginData.englishLanguageCode,
        },
      );
      await use(context);
      await context.close();
    },
    { scope: 'worker' },
  ],

  workerPage: [
    async ({ workerContext }, use) => {
      const page = await workerContext.newPage();
      const loginPage = new LoginPage(page);
      await loginPage.navigate();
      await use(page);
    },
    { scope: 'worker' },
  ],

  page: async ({ workerPage }, use) => {
    await use(workerPage);
  },

  loginPage: async ({ workerPage }, use) => {
    const loginPage = new LoginPage(workerPage);
    await loginPage.prepareLoginScreenForTest();
    await use(loginPage);
    await loginPage.resetAfterTest();
  },
});

export { expect } from '@playwright/test';