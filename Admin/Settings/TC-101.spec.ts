import { test } from '../fixtures/settings.fixture';

test('TC_AP_101 - Verify Stamp Can Be Deleted', async ({ settingsPage }) => {
  const { stamps } = await settingsPage.fetchApprovalStampsFromApi();
  test.skip(stamps.length === 0, 'No approval stamps available from API to delete');

  await settingsPage.openSeeAllStamps({ tab: 'approval' });
  await settingsPage.deleteFirstStampInModal();
  await settingsPage.closeModal();
});
