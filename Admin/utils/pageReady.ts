import { expect, type Page } from '@playwright/test';
import { adminPageTitle } from './adminPageTitle';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function waitForLoadingToFinish(page: Page) {
  const loading = page.getByText('Loading...', { exact: true });
  if (await loading.isVisible().catch(() => false)) {
    await loading.waitFor({ state: 'hidden', timeout: 90_000 }).catch(() => undefined);
  }
}

/** Assert a main admin route is ready — uses page-specific markers, not only #pageTitle. */
export async function expectAdminPageReady(page: Page, path: string, title: string) {
  const normalizedPath = path.replace(/\/$/, '');
  await expect(page).toHaveURL(new RegExp(`${escapeRegex(normalizedPath)}(?:/|$|\\?)`), {
    timeout: 60_000,
  });
  await waitForLoadingToFinish(page);

  if (normalizedPath === '/settings') {
    await expect(page.locator('.setting-description').first()).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('.stamp-details').first()).toBeVisible({ timeout: 30_000 });
    return;
  }

  if (normalizedPath === '/categories') {
    await expect(
      page.locator('.categories-page-heading h1, .category-editor-header h1, #pageTitle').first(),
    ).toHaveText(title, { timeout: 60_000 });
    return;
  }

  await expect(adminPageTitle(page)).toHaveText(title, { timeout: 60_000 });
}
