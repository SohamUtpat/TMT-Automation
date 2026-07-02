import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';
import { BulkUploadCsvBuilder } from '../utils/BulkUploadCsvBuilder';

/**
 * Recommended bulk-upload order: 6 — reject uploads above 1000-record batch limit.
 */
test('TC_AP_269 - Verify Bulk Upload With More Than 1000 Users At A Time', async ({
  mobileUsersPage,
}) => {
  test.setTimeout(300_000);

  const recordCount = MobileUsersData.limits.bulkUploadBatchSize + 1;
  const csvPath = BulkUploadCsvBuilder.writeTempCsv(recordCount, {
    filename: `bulk-upload-${recordCount}-over-limit.csv`,
  });

  await test.step('Open bulk upload page', async () => {
    await mobileUsersPage.openBulkUploadFromListing();
  });

  await test.step(`Upload CSV with ${recordCount} records and verify rejection`, async () => {
    await mobileUsersPage.selectBulkUploadFile(csvPath);
    await mobileUsersPage.clickBulkUploadSubmit();
    await mobileUsersPage.expectBulkUploadRejected(MobileUsersData.bulkUpload.messages.overBatchLimit);
  });
});
