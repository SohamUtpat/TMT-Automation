import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_151 - Verify Total Members Opens Members List', async ({ groupsPage }) => {
  await groupsPage.expectGroupsLoaded();

  await groupsPage.openMembersList(GroupsData.groupWithMembers.name);

  await expect(groupsPage.backButton()).toBeVisible();
  await expect(groupsPage.membersPageTitle(GroupsData.groupWithMembers.name)).toBeVisible();
  await expect(groupsPage.removeUsersButton()).toBeVisible();
  await expect(groupsPage.table()).toBeVisible();
});
