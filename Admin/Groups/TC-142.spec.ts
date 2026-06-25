import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_142 - Verify Create Group Cancelled', async ({ groupsPage }) => {
  const group = GroupsData.uniqueGroup('Cancel');

  await groupsPage.openCreateGroupModal();
  await groupsPage.fillCreateForm(group.name, group.code);
  await groupsPage.cancelCreate();

  await expect(groupsPage.createModal()).not.toBeVisible();
  await groupsPage.expectGroupNotVisible(group.name);
});
