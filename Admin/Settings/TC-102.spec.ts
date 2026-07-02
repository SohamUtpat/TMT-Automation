import { test, expect } from '../fixtures/settings.fixture';
import { SettingsData } from '../data/SettingsData';

test('TC_AP_102 - Verify Message After Stamp Deletion', async ({ settingsPage }) => {
  const { stamps } = await settingsPage.fetchApprovalStampsFromApi();
  test.skip(stamps.length === 0, 'No approval stamps available from API to delete');

  await settingsPage.openSeeAllStamps({ tab: 'approval' });
  await settingsPage.deleteFirstStampInModal();
  await expect(settingsPage.toast(SettingsData.messages.stampDeleted)).toBeVisible();
  await settingsPage.closeModal();
});
