import { test, expect } from '../fixtures/settings.fixture';
import { SettingsData } from '../data/SettingsData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_103 - Verify Upload Option For New Stamps', async ({ settingsPage }) => {
  await settingsPage.openUploadStamps();
  await expect(settingsPage.uploadButton()).toBeVisible();
  await expect(settingsPage.stampUploadInput()).toBeAttached();
  await settingsPage.closeModal();
});
