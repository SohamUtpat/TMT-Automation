import { test, expect } from '../fixtures/settings.fixture';
import { SettingsData } from '../data/SettingsData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_89 - Verify Default Language Is Updated In Settings', async ({ settingsPage }) => {
  await settingsPage.updateSupportDetails({ languageLabel: SettingsData.languages.thai.label });
  const api = await settingsPage.fetchSettingsFromApi();
  expect(api.CHANGE_LANGUAGE).toBe(SettingsData.languages.thai.code);
});
