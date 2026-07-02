import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_126 - Verify Group Delete Blocked When Users Exist', async ({ groupsPage }) => {
  await groupsPage.expectGroupsTitle();

  const group = await groupsPage.getApiFirstGroupWithMembers();
  await expect(groupsPage.groupRow(group.name)).toBeVisible({ timeout: 30_000 });

  await groupsPage.clickDeleteGroup(group.name);

  await expect(groupsPage.deleteBlockedModal()).toBeVisible();
  await expect(groupsPage.page.getByText(GroupsData.deleteModal.blockedTitle)).toBeVisible();
  await expect(groupsPage.page.getByText(GroupsData.deleteModal.blockedMessage)).toBeVisible();
  await expect(groupsPage.page.getByText(GroupsData.deleteModal.blockedHint)).toBeVisible();

  await groupsPage.dismissBlockedDelete();
});
