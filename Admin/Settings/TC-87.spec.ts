import { test, expect } from '../fixtures/settings.fixture';
import { SettingsData } from '../data/SettingsData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_87 - Verify Support URL Is Updated', async ({ settingsPage, settingsBaseline }) => {
  const update = SettingsData.buildSupportUpdate();
  await settingsPage.updateSupportDetails({
    url: update.url,
    languageLabel: settingsPage.mapLanguageCodeToLabel(settingsBaseline.CHANGE_LANGUAGE),
  });
  const api = await settingsPage.fetchSettingsFromApi();
  expect(api.url).toBe(update.url);
});
