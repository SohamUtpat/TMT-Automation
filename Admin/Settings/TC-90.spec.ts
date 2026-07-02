import { test, expect } from '../fixtures/settings.fixture';
import { SettingsData } from '../data/SettingsData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_90 - Verify Settings Default Language On Create User Page', async ({ settingsPage }) => {
  await settingsPage.updateSupportDetails({ languageLabel: SettingsData.languages.japanese.label });
  await settingsPage.expectCreateUserDefaultLanguage(SettingsData.languages.japanese.label);
});
