import { test, expect } from '../fixtures/mobile-users.fixture';
import { BulkUploadCsvBuilder } from '../utils/BulkUploadCsvBuilder';
import { TestDataGenerator } from '../utils/TestDataGenerator';

/**
 * Recommended bulk-upload order: 11 — error report download after a failed row upload.
 */
test('TC_AP_278 - Verify Bulk Upload Error Report Can Be Downloaded', async ({ mobileUsersPage }) => {
  const fileName = `bulk-errors-${Date.now()}.csv`;
  const csvPath = BulkUploadCsvBuilder.writeTempCsv(1, {
    filename: fileName,
    rowBuilder: () => ({
      userName: TestDataGenerator.generateUniqueUsername(),
      firstName: 'Bad',
      lastName: 'Row',
      email: TestDataGenerator.generateInvalidEmail(),
      password: TestDataGenerator.generateWeakPassword(),
      language: 'invalid-lang',
      roles: 'INVALID_ROLE',
    }),
  });

  await test.step('Upload CSV with invalid data to generate failures', async () => {
    await mobileUsersPage.openBulkUploadFromListing();
    await mobileUsersPage.uploadBulkCsv(csvPath);
    await mobileUsersPage.expectBulkUploadProcessed();
  });

  await test.step('Download error report from history when available', async () => {
    await mobileUsersPage.navigateToBulkUploadHistory();
    const row = await mobileUsersPage.waitForBulkUploadHistoryRow(fileName);

    await expect
      .poll(async () => row.innerText(), { timeout: 180_000 })
      .toMatch(/Failed|Failure|Error/i);

    const download = await mobileUsersPage.downloadHistoryErrorReport(fileName);
    expect(download.suggestedFilename()).toMatch(/\.csv|error|report/i);
  });
});
