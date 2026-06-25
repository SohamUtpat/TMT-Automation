import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_148 - Verify Group Code Accepts 2 to 15 Characters', async ({ groupsPage }) => {
  const group = GroupsData.uniqueGroup('Cd');

  await groupsPage.createGroup(group.name, group.code);
  await groupsPage.expectGroupVisible(group.name);

  await groupsPage.deleteGroupIfPossible(group.name);
});
