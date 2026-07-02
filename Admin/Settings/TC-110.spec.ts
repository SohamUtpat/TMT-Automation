import { test, expect } from '../fixtures/settings.fixture';
import { SettingsData } from '../data/SettingsData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_110 - Verify User Can Add Stamp', async ({ settingsPage }) => {
  await settingsPage.openUploadStamps();
  await settingsPage.uploadStampFiles([SettingsData.testAssets.validStamp]);
  await expect(settingsPage.toast(SettingsData.messages.stampUploaded)).toBeVisible({ timeout: 60_000 });
  await settingsPage.closeModal();
});
