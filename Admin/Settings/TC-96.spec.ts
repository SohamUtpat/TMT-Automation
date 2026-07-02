import { test, expect } from '../fixtures/settings.fixture';
import { SettingsData } from '../data/SettingsData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_96 - Verify Contact Over 15 Shows Validation', async ({ settingsPage }) => {
  await settingsPage.openSupportDetailsEdit();
  await settingsPage.fillSupportForm({ contact: '1'.repeat(16) });
  await settingsPage.submitSupportForm({ waitForSuccess: false });
  await settingsPage.expectValidationMessage(SettingsData.validation.contactLength);
  await settingsPage.closeModal();
});
