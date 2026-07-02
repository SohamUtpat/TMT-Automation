import { test, expect } from '../fixtures/settings.fixture';
import { SettingsData } from '../data/SettingsData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_105 - Verify Invalid Stamp Format Shows Error', async ({ settingsPage }) => {
  await settingsPage.openUploadStamps();
  await settingsPage.uploadStampFiles([SettingsData.testAssets.invalidPdf]);
  await settingsPage.expectValidationMessage(SettingsData.validation.invalidStampFormat);
  await settingsPage.closeModal();
});
