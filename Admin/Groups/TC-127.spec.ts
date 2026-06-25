import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_127 - Verify Group Deleted When Total Members Is Zero', async ({ groupsPage }) => {
  const group = GroupsData.uniqueGroup('Del');

  await groupsPage.createGroup(group.name, group.code);
  await groupsPage.expectGroupVisible(group.name);

  const memberCount = await groupsPage.getMemberCount(group.name);
  expect(memberCount).toBe(0);

  await groupsPage.clickDeleteGroup(group.name);
  await expect(groupsPage.deleteConfirmModal()).toBeVisible();
  await expect(groupsPage.page.getByText(GroupsData.deleteModal.confirmTitle)).toBeVisible();

  await groupsPage.confirmDelete();
  await groupsPage.expectGroupNotVisible(group.name);
});
