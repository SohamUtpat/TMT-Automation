import { test, expect } from '../fixtures/settings.fixture';
import { SettingsData } from '../data/SettingsData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_97 - Verify Contact Rejects Invalid Characters', async ({ settingsPage }) => {
  await settingsPage.openSupportDetailsEdit();
  await settingsPage.fillSupportForm({ contact: TestDataGenerator.generateInvalidPhone() });
  await settingsPage.submitSupportForm({ waitForSuccess: false });
  await settingsPage.expectValidationMessage(SettingsData.validation.invalidContact);
  await settingsPage.closeModal();
});
