import { test, expect } from '../fixtures/settings.fixture';
import { SettingsData } from '../data/SettingsData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_85 - Verify Support Details Edit Form Opens', async ({ settingsPage }) => {
  await settingsPage.openSupportDetailsEdit();
  await expect(settingsPage.urlInput()).toBeVisible();
  await expect(settingsPage.emailInput()).toBeVisible();
  await expect(settingsPage.contactInput()).toBeVisible();
  await settingsPage.closeModal();
});
