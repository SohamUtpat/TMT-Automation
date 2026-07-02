import { test } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

/**
 * Recommended bulk-upload order: 4 — negative format validation.
 */
test('TC_AP_267 - Verify Bulk Upload With Invalid File Format', async ({ mobileUsersPage }) => {
  await test.step('Open bulk upload page', async () => {
    await mobileUsersPage.openBulkUploadFromListing();
  });

  await test.step('Upload non-CSV file and verify rejection', async () => {
    await mobileUsersPage.selectBulkUploadFile(MobileUsersData.testAssets.invalidPdf);
    await mobileUsersPage.clickBulkUploadSubmit();
    await mobileUsersPage.expectBulkUploadRejected(MobileUsersData.validation.bulkCsvOnly);
  });
});
