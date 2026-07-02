import { test, expect } from '../fixtures/settings.fixture';
import { SettingsData } from '../data/SettingsData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_107 - Verify More Than 50 Stamps Cannot Upload At Once', async ({ settingsPage }) => {
  const stamp = SettingsData.testAssets.validStamp;
  const files = Array.from({ length: 51 }, () => stamp);
  await settingsPage.openUploadStamps();
  await settingsPage.uploadStampFiles(files);
  await settingsPage.expectValidationMessage(SettingsData.validation.maxStampBatch);
  await settingsPage.closeModal();
});
