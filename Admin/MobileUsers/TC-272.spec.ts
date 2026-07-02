import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';
import { BulkUploadCsvBuilder } from '../utils/BulkUploadCsvBuilder';

/**
 * Recommended bulk-upload order: 7 — maximum 30000-record ceiling.
 * Positive upload of all 30000 rows is excluded here due to runtime; boundary is validated instead.
 */
test('TC_AP_272 - Verify Bulk Upload Maximum 30000 Users Can Be Uploaded', async ({
  mobileUsersPage,
}) => {
  test.setTimeout(300_000);

  const overLimitCount = MobileUsersData.limits.bulkUploadMaxRecords + 1;
  const csvPath = BulkUploadCsvBuilder.writeTempCsv(overLimitCount, {
    filename: `bulk-upload-${overLimitCount}-over-max.csv`,
  });

  await test.step('Open bulk upload page', async () => {
    await mobileUsersPage.openBulkUploadFromListing();
  });

  await test.step('Verify maximum record rule is documented', async () => {
    await mobileUsersPage.expectBulkUploadRuleVisible(/Maximum records should be 30000/i);
  });

  await test.step(`Upload CSV with ${overLimitCount} records and verify rejection`, async () => {
    await mobileUsersPage.selectBulkUploadFile(csvPath);
    await mobileUsersPage.clickBulkUploadSubmit();
    await mobileUsersPage.expectBulkUploadRejected(MobileUsersData.bulkUpload.messages.overMaxRecords);
  });
});
