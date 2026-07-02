import { test, expect } from '../fixtures/settings.fixture';
import { SettingsData } from '../data/SettingsData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_98 - Verify Invalid Data Cannot Be Saved', async ({ settingsPage }) => {
  await settingsPage.openSupportDetailsEdit();
  await settingsPage.fillSupportForm({
    url: 'bad-url',
    email: TestDataGenerator.generateInvalidEmail(),
    contact: 'abc',
  });
  await settingsPage.submitSupportForm({ waitForSuccess: false });
  await expect(settingsPage.settingsModal()).toBeVisible();
  await settingsPage.closeModal();
});
