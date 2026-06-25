import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_129 - Verify HQ Group Has No Delete Option', async ({ groupsPage }) => {
  await groupsPage.expectGroupsLoaded();
  await expect(groupsPage.groupRow(GroupsData.hqGroup.name)).toBeVisible();
  await expect(groupsPage.deleteButton(GroupsData.hqGroup.name)).toHaveCount(0);
  await expect(groupsPage.editButton(GroupsData.hqGroup.name)).toBeVisible();
});
