import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';
import { BulkUploadCsvBuilder } from '../utils/BulkUploadCsvBuilder';

/**
 * Recommended bulk-upload order: 5 — positive batch upload at 1000-record limit.
 */
test('TC_AP_268 - Verify Bulk Upload With Large CSV File Can Upload 1000 Records', async ({
  mobileUsersPage,
}) => {
  test.setTimeout(600_000);

  const recordCount = MobileUsersData.limits.bulkUploadBatchSize;
  const csvPath = BulkUploadCsvBuilder.writeTempCsv(recordCount, {
    filename: `bulk-upload-${recordCount}-valid.csv`,
  });

  await test.step('Open bulk upload page', async () => {
    await mobileUsersPage.openBulkUploadFromListing();
  });

  await test.step(`Upload CSV with ${recordCount} valid records`, async () => {
    const response = await mobileUsersPage.uploadBulkCsv(csvPath);
    expect(response.ok()).toBeTruthy();
    await mobileUsersPage.expectBulkUploadProcessed();
  });
});
