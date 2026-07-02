import { test as base, expect, type BrowserContext, type Page } from '@playwright/test';
import path from 'path';
import { ChangePasswordPage, type TestAdminCredentials } from '../pages/ChangePasswordPage';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

const authFile = path.join(__dirname, '../../playwright/.auth/admin.json');
const emptyStorageState = { cookies: [], origins: [] } as const;

async function loginAsTestUser(page: Page, credentials: TestAdminCredentials) {
  await page.goto(loginData.baseUrl, { waitUntil: 'commit', timeout: 120_000 });

  if (!(await page.locator('#username').isVisible().catch(() => false))) {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.context().clearCookies();
    await page.goto(loginData.baseUrl, { waitUntil: 'commit', timeout: 120_000 });
  }

  const login = new LoginPage(page);
  await expect(page.locator('#username')).toBeVisible({ timeout: 30_000 });
  await login.login(credentials.userName, credentials.password);

  // Some builds complete the login API call before the UI route updates.
  // Force an authenticated landing page so #pageTitle becomes deterministic.
  await page.goto('/dashboard', { waitUntil: 'commit', timeout: 120_000 }).catch(() => undefined);
  await expect(page.locator('#pageTitle')).toBeVisible({ timeout: 60_000 });
}

type ChangePasswordFixtures = {
  changePasswordPage: ChangePasswordPage;
  testUser: TestAdminCredentials;
};

type WorkerFixtures = {
  workerTestUser: TestAdminCredentials;
  workerContext: BrowserContext;
  workerPage: Page;
};

export const test = base.extend<ChangePasswordFixtures, WorkerFixtures>({
  workerTestUser: [
    async ({}, use) => {
      // Use known-good credentials instead of depending on a dedicated admin-user create API.
      // The suite mutates `testUser.password` when a password change succeeds.
      const credentials: TestAdminCredentials = {
        userName: loginData.validUser,
        password: loginData.validPassword,
        email: '',
        firstName: '',
        lastName: '',
      };
      await use(credentials);
    },
    { scope: 'worker' },
  ],

  workerContext: [
    async ({ browser }, use) => {
      const context = await browser.newContext({ storageState: emptyStorageState });
      await use(context);
      await context.close();
    },
    { scope: 'worker' },
  ],

  workerPage: [
    async ({ workerContext, workerTestUser }, use) => {
      const page = await workerContext.newPage();
      await loginAsTestUser(page, workerTestUser);
      await use(page);
    },
    { scope: 'worker' },
  ],

  page: async ({ workerPage }, use) => {
    await use(workerPage);
  },

  testUser: async ({ workerTestUser }, use) => {
    await use(workerTestUser);
  },

  changePasswordPage: async ({ workerPage, testUser }, use) => {
    const changePasswordPage = new ChangePasswordPage(workerPage);
    await use(changePasswordPage);
    await changePasswordPage.resetAfterTest(testUser);
  },
});

export { expect } from '@playwright/test';
