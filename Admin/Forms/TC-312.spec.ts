import { test, expect } from '../fixtures/forms.fixture';

test('TC_AP_312 - Verify Search Bar Visibility', async ({ formsPage }) => {
  await expect(formsPage.searchInput()).toBeVisible();
  await expect(formsPage.searchInput()).toBeEnabled();
});
