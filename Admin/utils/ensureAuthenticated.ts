import { expect, type Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

export type LoginCredentials = {
  username: string;
  password: string;
};

export async function isOnLoginPage(page: Page): Promise<boolean> {
  const usernameVisible = await page.locator('#username').isVisible().catch(() => false);
  const loggedIn = await page.locator('#pageTitle').isVisible().catch(() => false);
  return usernameVisible && !loggedIn;
}

/** Re-login when storageState token was rejected and the app redirected to login. */
export async function ensureAuthenticated(
  page: Page,
  credentials: LoginCredentials = {
    username: loginData.validUser,
    password: loginData.validPassword,
  },
) {
  if (!(await isOnLoginPage(page))) {
    return;
  }

  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.context().clearCookies();

  const login = new LoginPage(page);
  await login.navigate();
  await login.login(credentials.username, credentials.password);
  await expect(page.locator('#pageTitle')).toBeVisible({ timeout: 60_000 });
}
