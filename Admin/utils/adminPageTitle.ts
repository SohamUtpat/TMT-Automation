import type { Locator, Page } from '@playwright/test';

/**
 * Page heading locator for admin routes.
 * Newer UI uses `.listing-page-heading h1`; keep `#pageTitle` as a fallback
 * for environments that still expose the legacy id.
 */
export function adminPageTitle(page: Page): Locator {
  return page.locator('.listing-page-heading h1, #pageTitle').first();
}
