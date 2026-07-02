import { test, expect } from '../fixtures/settings.fixture';
import { SettingsData } from '../data/SettingsData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_106 - Verify Multiple Stamps Can Be Uploaded', async ({ settingsPage }) => {
  const stamp = SettingsData.testAssets.validStamp;
  await settingsPage.openUploadStamps();
  await settingsPage.uploadStampFiles([stamp, stamp]);
  await expect(settingsPage.toast(SettingsData.messages.stampUploaded)).toBeVisible({ timeout: 60_000 });
  await settingsPage.closeModal();
});
