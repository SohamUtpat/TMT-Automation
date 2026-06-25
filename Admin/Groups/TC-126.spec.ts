import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_126 - Verify Group Delete Blocked When Users Exist', async ({ groupsPage }) => {
  await groupsPage.expectGroupsLoaded();

  const memberCount = await groupsPage.getMemberCount(GroupsData.groupForDeleteBlocked.name);
  expect(memberCount).toBeGreaterThan(0);

  await groupsPage.clickDeleteGroup(GroupsData.groupForDeleteBlocked.name);

  await expect(groupsPage.deleteBlockedModal()).toBeVisible();
  await expect(groupsPage.page.getByText(GroupsData.deleteModal.blockedTitle)).toBeVisible();
  await expect(groupsPage.page.getByText(GroupsData.deleteModal.blockedMessage)).toBeVisible();
  await expect(groupsPage.page.getByText(GroupsData.deleteModal.blockedHint)).toBeVisible();

  await groupsPage.dismissBlockedDelete();
  await expect(groupsPage.groupRow(GroupsData.groupForDeleteBlocked.name)).toBeVisible();
});
