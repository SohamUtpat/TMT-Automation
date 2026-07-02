import { test, expect } from '../fixtures/settings.fixture';
import { SettingsData } from '../data/SettingsData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_118 - Verify Default Language Reflected In UI', async ({ settingsPage }) => {
  await settingsPage.updateSupportDetails({ languageLabel: SettingsData.languages.japanese.label });
  const api = await settingsPage.fetchSettingsFromApi();
  await settingsPage.expectDashboardTitle(settingsPage.mapLanguageCodeToDashboardTitle(api.CHANGE_LANGUAGE));
});
