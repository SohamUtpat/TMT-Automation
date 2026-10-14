import { expect, type Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';
import { adminPageTitle } from './adminPageTitle';

export type LoginCredentials = {
  username: string;
  password: string;
};

export async function isOnLoginPage(page: Page): Promise<boolean> {
  const usernameVisible = await page.locator('#username').isVisible().catch(() => false);
  const loggedIn = await adminPageTitle(page).isVisible().catch(() => false);
  return usernameVisible && !loggedIn;
}

/** Stale JWT can leave an authenticated route with an empty shell (no login form, no page title). */
export async function isBrokenAppShell(page: Page): Promise<boolean> {
  const url = page.url();
  if (!url || url === 'about:blank' || url.startsWith('chrome-error://')) {
    return false;
  }

  const pathname = new URL(url).pathname.replace(/\/$/, '') || '/';
  if (pathname === '/' || pathname === '/login') {
    return false;
  }

  if (await adminPageTitle(page).isVisible().catch(() => false)) {
    return false;
  }

  if (await page.locator('#username').isVisible().catch(() => false)) {
    return false;
  }

  if (await page.getByText('Loading...', { exact: true }).isVisible().catch(() => false)) {
    return false;
  }

  const bodyText = await page.locator('body').innerText().catch(() => '');
  return bodyText.trim().length < 5;
}

async function clearSession(page: Page) {
  await page
    .evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    })
    .catch(() => undefined);
  await page.context().clearCookies();
}

async function waitForAppShell(page: Page) {
  const bundle = page
    .waitForResponse((resp) => resp.url().includes('/bundle.js'), { timeout: 300_000 })
    .catch(() => undefined);
  await bundle;
  await page
    .locator('.listing-page-heading h1, #pageTitle, #username')
    .first()
    .waitFor({ state: 'visible', timeout: 300_000 })
    .catch(() => undefined);
}

async function performLogin(page: Page, credentials: LoginCredentials) {
  await clearSession(page);
  const login = new LoginPage(page);
  await login.navigate();
  await login.login(credentials.username, credentials.password);
  await expect(adminPageTitle(page)).toBeVisible({ timeout: 300_000 });
}

/** Re-login when storageState token was rejected and the app redirected to login. */
export async function ensureAuthenticated(
  page: Page,
  credentials: LoginCredentials = {
    username: loginData.validUser,
    password: loginData.validPassword,
  },
) {
  if (await isOnLoginPage(page)) {
    await performLogin(page, credentials);
    return;
  }

  if (!(await isBrokenAppShell(page))) {
    return;
  }

  await page.goto('/dashboard', { waitUntil: 'commit', timeout: 300_000 });
  await waitForAppShell(page);

  if (await adminPageTitle(page).isVisible().catch(() => false)) {
    return;
  }

  if (await isOnLoginPage(page)) {
    await performLogin(page, credentials);
    return;
  }

  await performLogin(page, credentials);
}
