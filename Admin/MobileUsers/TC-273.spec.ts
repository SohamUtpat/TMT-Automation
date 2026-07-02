import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';
import { BulkUploadCsvBuilder } from '../utils/BulkUploadCsvBuilder';
import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * Recommended bulk-upload order: 3 — CSV field rules from TC_AP_273 manual steps.
 */
test('TC_AP_273 - Verify CSV File Consists Of Fields Defined In Steps', async ({ mobileUsersPage }) => {
  await test.step('Open bulk upload page', async () => {
    await mobileUsersPage.openBulkUploadFromListing();
  });

  await test.step('Verify TC_AP_273 field and validation rules are documented on the page', async () => {
    await mobileUsersPage.expectBulkUploadFieldRulesVisible();
    await mobileUsersPage.expectBulkUploadRuleVisible(/Only \.csv file format is supported/i);
    await mobileUsersPage.expectBulkUploadRuleVisible(/Maximum records should be 30000/i);
    await mobileUsersPage.expectBulkUploadRuleVisible(/eng or thai or jpn/i);
    await mobileUsersPage.expectBulkUploadRuleVisible(/maximum 10 alphanumeric characters/i);
  });

  await test.step('Verify downloaded template contains required CSV headers', async () => {
    const download = await mobileUsersPage.downloadBulkTemplate();
    const downloadPath = path.join(os.tmpdir(), `tc273-${download.suggestedFilename()}`);
    await download.saveAs(downloadPath);

    const raw = fs.readFileSync(downloadPath);
    const content = raw.includes(0x00)
      ? raw.toString('utf16le').replace(/^\uFEFF/, '')
      : raw.toString('utf8');
    const headerLine = content.split(/\r?\n/)[0] ?? '';

    for (const column of BulkUploadCsvBuilder.specHeaders) {
      expect(headerLine).toContain(column);
    }

    expect(headerLine).toContain('Password');
  });
});
