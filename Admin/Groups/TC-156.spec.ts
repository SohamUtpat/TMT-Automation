import { test, expect } from '../fixtures/groups.fixture';

test('TC_AP_156 - Verify Remove Users Enabled When Member Selected', async ({ groupsPage }) => {
  const hqGroup = await groupsPage.prepareHqGroupFromApi();
  await groupsPage.openMembersList(hqGroup.name);

  await groupsPage.selectMemberByIndex(0);
  await expect(groupsPage.removeUsersButton()).toBeEnabled();

  await groupsPage.goBackToGroups();
});
