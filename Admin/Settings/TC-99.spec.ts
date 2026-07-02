import { test, expect } from '../fixtures/settings.fixture';
import { SettingsData } from '../data/SettingsData';

test('TC_AP_99 - Verify Support And Stamp Fields On Settings Page', async ({ settingsPage }) => {
  const apiSettings = await settingsPage.fetchSettingsFromApi();
  const { total: standardTotal } = await settingsPage.fetchStandardStampsFromApi();
  const { total: approvalTotal } = await settingsPage.fetchApprovalStampsFromApi();

  for (const field of SettingsData.supportFields) {
    await expect(settingsPage.supportDetailsSection().getByText(field, { exact: false })).toBeVisible();
  }
  expect(apiSettings.url).toBeTruthy();
  expect(apiSettings.email).toBeTruthy();

  await expect(settingsPage.stampsSection()).toBeVisible();
  await expect(settingsPage.seeAllStampsButton()).toBeVisible();
  await expect(settingsPage.uploadNewStampButton()).toBeVisible();
  expect(standardTotal).toBeGreaterThanOrEqual(0);
  expect(approvalTotal).toBeGreaterThanOrEqual(0);

  await settingsPage.openSeeAllStamps();
  await expect(settingsPage.settingsModal().getByText(SettingsData.stamps.tabs.standard)).toBeVisible();
  await expect(settingsPage.settingsModal().getByText(SettingsData.stamps.tabs.approval)).toBeVisible();
  await settingsPage.closeModal();
});
