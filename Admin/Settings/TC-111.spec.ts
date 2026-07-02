import { test, expect } from '../fixtures/settings.fixture';
import { SettingsData } from '../data/SettingsData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_111 - Verify User Can Add Multiple Stamps', async ({ settingsPage }) => {
  const stamp = SettingsData.testAssets.validStamp;
  await settingsPage.openUploadStamps();
  await settingsPage.uploadStampFiles([stamp, stamp, stamp]);
  await expect(settingsPage.toast(SettingsData.messages.stampUploaded)).toBeVisible({ timeout: 60_000 });
  await settingsPage.closeModal();
});
