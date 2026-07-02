import { test, expect } from '../fixtures/settings.fixture';
import { SettingsData } from '../data/SettingsData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_88 - Verify Support Email Is Updated', async ({ settingsPage, settingsBaseline }) => {
  const update = SettingsData.buildSupportUpdate();
  await settingsPage.updateSupportDetails({
    email: update.email,
    languageLabel: settingsPage.mapLanguageCodeToLabel(settingsBaseline.CHANGE_LANGUAGE),
  });
  const api = await settingsPage.fetchSettingsFromApi();
  expect(api.email).toBe(update.email);
});
