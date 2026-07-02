import { test, expect } from '../fixtures/mobile-users.fixture';
import { BulkUploadCsvBuilder } from '../utils/BulkUploadCsvBuilder';

/**
 * Recommended bulk-upload order: 10 — download uploaded file from history.
 */
test('TC_AP_279 - Verify Bulk Upload File Can Be Downloaded From History', async ({
  mobileUsersPage,
}) => {
  const fileName = `bulk-download-${Date.now()}.csv`;
  const csvPath = BulkUploadCsvBuilder.writeTempCsv(1, { filename: fileName });

  await test.step('Upload a valid CSV file', async () => {
    await mobileUsersPage.openBulkUploadFromListing();
    await mobileUsersPage.uploadBulkCsv(csvPath);
    await mobileUsersPage.expectBulkUploadProcessed();
  });

  await test.step('Download uploaded file from history', async () => {
    await mobileUsersPage.navigateToBulkUploadHistory();
    const download = await mobileUsersPage.downloadHistoryUploadedFile(fileName);
    expect(download.suggestedFilename()).toBeTruthy();
  });
});
