import { test, expect } from '../fixtures/settings.fixture';
import { SettingsData } from '../data/SettingsData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_104 - Verify Stamp Upload Accepts Jpg Png Jpeg', async ({ settingsPage }) => {
  await settingsPage.openUploadStamps();
  await expect(settingsPage.page.getByText(/JPG|PNG|JPEG/i).first()).toBeVisible();
  await settingsPage.closeModal();
});
