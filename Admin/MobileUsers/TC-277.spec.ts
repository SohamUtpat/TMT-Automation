import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';
import { BulkUploadCsvBuilder } from '../utils/BulkUploadCsvBuilder';

/**
 * Recommended bulk-upload order: 9 — history listing details after an upload.
 */
test('TC_AP_277 - Verify Bulk Upload History Shows Expected Details', async ({ mobileUsersPage }) => {
  const fileName = `bulk-history-${Date.now()}.csv`;
  const csvPath = BulkUploadCsvBuilder.writeTempCsv(1, { filename: fileName });

  await test.step('Upload a valid CSV file', async () => {
    await mobileUsersPage.openBulkUploadFromListing();
    await mobileUsersPage.uploadBulkCsv(csvPath);
    await mobileUsersPage.expectBulkUploadProcessed();
  });

  await test.step('Open history and verify table columns', async () => {
    await mobileUsersPage.navigateToBulkUploadHistory();
    await mobileUsersPage.expectBulkUploadHistoryColumnsVisible();
  });

  await test.step('Verify uploaded file row contains expected history fields', async () => {
    const row = await mobileUsersPage.waitForBulkUploadHistoryRow(fileName);
    const rowText = await row.innerText();

    expect(rowText).toContain(fileName);
    expect(rowText).toMatch(/Pending|Success|Failed|Processing/i);
    expect(rowText).toMatch(/\d/);
  });
});
