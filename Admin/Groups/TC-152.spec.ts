import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_152 - Verify Back Button Redirects to Groups Page', async ({ groupsPage }) => {
  await groupsPage.openMembersList(GroupsData.groupWithMembers.name);
  await groupsPage.goBackToGroups();
  await groupsPage.expectGroupsLoaded();
});
