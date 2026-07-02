import { test, expect } from '../fixtures/mobile-users.fixture';

/**
 * Recommended bulk-upload order: 8 — history navigation.
 */
test('TC_AP_276 - Verify Bulk Upload History Tab Can Be Opened', async ({ mobileUsersPage }) => {
  await test.step('Open bulk upload page', async () => {
    await mobileUsersPage.openBulkUploadFromListing();
  });

  await test.step('Open history tab from bulk upload page', async () => {
    await mobileUsersPage.openBulkUploadHistoryFromPage();
    await expect(mobileUsersPage.page).toHaveURL(/bulk-upload-history/);
  });
});
