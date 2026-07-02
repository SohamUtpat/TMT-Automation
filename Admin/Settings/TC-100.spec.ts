import { test, expect } from '../fixtures/settings.fixture';
import { SettingsData } from '../data/SettingsData';

test('TC_AP_100 - Verify Stamps Can Be Viewed', async ({ settingsPage }) => {
  const { stamps: standardStamps } = await settingsPage.fetchStandardStampsFromApi();
  test.skip(standardStamps.length === 0, 'No standard stamps returned from API');

  await expect(settingsPage.stampPreviewImages().first()).toBeVisible({ timeout: 30_000 });

  const { stamps: approvalStamps } = await settingsPage.fetchApprovalStampsFromApi();
  test.skip(approvalStamps.length === 0, 'No approval stamps returned from API');

  await settingsPage.openSeeAllStamps({ tab: 'approval' });
  expect(await settingsPage.stampImagesInModal().count()).toBeGreaterThan(0);
  expect(approvalStamps.length).toBeGreaterThan(0);
  await settingsPage.closeModal();
});
