import { test, expect } from '../fixtures/settings.fixture';
import { SettingsData } from '../data/SettingsData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_94 - Verify Only Valid URL Format Accepted', async ({ settingsPage }) => {
  await settingsPage.openSupportDetailsEdit();
  await settingsPage.fillSupportForm({ url: 'not-a-valid-url' });
  await settingsPage.submitSupportForm({ waitForSuccess: false });
  await settingsPage.expectValidationMessage(SettingsData.validation.invalidUrl);
  await settingsPage.closeModal();
});
