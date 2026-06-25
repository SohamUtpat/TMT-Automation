import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_156 - Verify Remove Users Enabled When Member Selected', async ({ groupsPage }) => {
  await groupsPage.openMembersList(GroupsData.hqGroup.name);

  await groupsPage.selectMemberByIndex(0);
  await expect(groupsPage.removeUsersButton()).toBeEnabled();

  await groupsPage.goBackToGroups();
});
