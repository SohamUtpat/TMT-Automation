import { test, expect } from '../fixtures/settings.fixture';
import { SettingsData } from '../data/SettingsData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_86 - Verify Support URL Is Clickable', async ({ settingsPage, settingsBaseline }) => {
  expect(settingsBaseline.url).toBeTruthy();
  const popup = await settingsPage.clickSupportUrlLink();
  expect(popup.url()).toContain(settingsBaseline.url.replace(/^https?:\/\//, '').split('/')[0]);
  await popup.close();
});
