import { test, expect } from '../fixtures/settings.fixture';

test('TC_AP_112 - Verify Stamps Visible In See All View', async ({ settingsPage }) => {
  const { stamps } = await settingsPage.fetchApprovalStampsFromApi();
  test.skip(stamps.length === 0, 'No approval stamps returned from API');

  await settingsPage.openSeeAllStamps({ tab: 'approval' });
  await expect(settingsPage.stampImagesInModal().first()).toBeVisible({ timeout: 30_000 });
  await expect(settingsPage.stampDeleteIcons().first()).toBeVisible();
  await settingsPage.closeModal();
});
