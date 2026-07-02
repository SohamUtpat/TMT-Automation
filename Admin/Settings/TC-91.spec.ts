import { test, expect } from '../fixtures/settings.fixture';
import { SettingsData } from '../data/SettingsData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_91 - Verify Contact Details Are Updated', async ({ settingsPage, settingsBaseline }) => {
  const update = SettingsData.buildSupportUpdate();
  await settingsPage.updateSupportDetails({
    contact: update.contact,
    languageLabel: settingsPage.mapLanguageCodeToLabel(settingsBaseline.CHANGE_LANGUAGE),
  });
  const api = await settingsPage.fetchSettingsFromApi();
  expect(api.contact_details).toBe(update.contact);
});
