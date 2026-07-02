import { test, expect } from '../fixtures/settings.fixture';
import { SettingsData } from '../data/SettingsData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_95 - Verify Contact Number Maximum Length 15', async ({ settingsPage, settingsBaseline }) => {
  const contact = '1'.repeat(15);
  await settingsPage.updateSupportDetails({
    contact,
    languageLabel: settingsPage.mapLanguageCodeToLabel(settingsBaseline.CHANGE_LANGUAGE),
  });
  const api = await settingsPage.fetchSettingsFromApi();
  expect(api.contact_details).toBe(contact);
});
