import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';
import { BulkUploadCsvBuilder } from '../utils/BulkUploadCsvBuilder';
import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * Recommended bulk-upload order: 2 — template download before CSV validation tests.
 */
test('TC_AP_275 - Verify Bulk Upload Template Can Be Downloaded', async ({ mobileUsersPage }) => {
  let downloadPath = '';

  await test.step('Open bulk upload page', async () => {
    await mobileUsersPage.openBulkUploadFromListing();
  });

  await test.step('Download template and verify file name and headers', async () => {
    const download = await mobileUsersPage.downloadBulkTemplate();
    expect(download.suggestedFilename()).toBe(MobileUsersData.bulkUpload.templateFileName);

    downloadPath = path.join(os.tmpdir(), download.suggestedFilename());
    await download.saveAs(downloadPath);

    const raw = fs.readFileSync(downloadPath);
    const content = raw.includes(0x00)
      ? raw.toString('utf16le').replace(/^\uFEFF/, '')
      : raw.toString('utf8');
    const headerLine = content.split(/\r?\n/)[0] ?? '';

    for (const column of BulkUploadCsvBuilder.templateHeaders) {
      expect(headerLine).toContain(column);
    }
  });
});
