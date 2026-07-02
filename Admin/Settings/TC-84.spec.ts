import { test, expect } from '../fixtures/settings.fixture';
import { SettingsData } from '../data/SettingsData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_84 - Verify Support Fields Trim Spaces On Update', async ({ settingsPage, settingsBaseline }) => {
  const update = SettingsData.buildSupportUpdate();
  const languageLabel = settingsPage.mapLanguageCodeToLabel(settingsBaseline.CHANGE_LANGUAGE);

  await settingsPage.openSupportDetailsEdit();
  await settingsPage.fillSupportForm({
    url: `  ${update.url}  `,
    email: `  ${update.email}  `,
    contact: `  ${update.contact}  `,
    languageLabel,
  });
  await settingsPage.submitSupportForm();

  const api = await settingsPage.fetchSettingsFromApi();
  expect(api.url).toBe(update.url);
  expect(api.email).toBe(update.email);
  expect(api.contact_details).toBe(update.contact);
});
