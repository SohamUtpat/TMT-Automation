import { test, expect } from '../fixtures/settings.fixture';
import { SettingsData } from '../data/SettingsData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_116 - Verify Thai Persists After Re Login', async ({ settingsPage }) => {
  await settingsPage.updateSupportDetails({ languageLabel: SettingsData.languages.thai.label });
  await settingsPage.logoutAndLoginAgain();
  const api = await settingsPage.fetchSettingsFromApi();
  expect(api.CHANGE_LANGUAGE).toBe(SettingsData.languages.thai.code);
  await settingsPage.expectDashboardTitle(settingsPage.mapLanguageCodeToDashboardTitle(api.CHANGE_LANGUAGE));
});
