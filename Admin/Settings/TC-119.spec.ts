import { test, expect } from '../fixtures/settings.fixture';
import { SettingsData } from '../data/SettingsData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_119 - Verify Thai Language Persists After Logout Login', async ({ settingsPage }) => {
  await settingsPage.updateSupportDetails({ languageLabel: SettingsData.languages.thai.label });
  await settingsPage.logoutAndLoginAgain();
  await settingsPage.navigateToSettings();
  const api = await settingsPage.fetchSettingsFromApi();
  expect(api.CHANGE_LANGUAGE).toBe(SettingsData.languages.thai.code);
});
