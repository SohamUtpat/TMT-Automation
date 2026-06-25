import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_128 - Verify Group Name and Code Trim Spaces', async ({ groupsPage }) => {
  const group = GroupsData.uniqueGroup('Trim');

  await groupsPage.openCreateGroupModal();
  await groupsPage.fillCreateForm(`  ${group.name}  `, `  ${group.code}  `);
  await groupsPage.submitCreateAndWait();
  await groupsPage.searchGroups(group.name);

  await groupsPage.expectGroupVisible(group.name);
  await expect(groupsPage.groupRow(group.name).locator('td').nth(1)).toHaveText(group.name);

  await groupsPage.deleteGroupIfPossible(group.name);
  await groupsPage.clearSearch();
});
