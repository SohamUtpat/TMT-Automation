import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_132 - Verify Mandatory Fields Without Profile Photo', async ({ groupsPage }) => {
  const group = GroupsData.uniqueGroup('Man');

  await groupsPage.createGroup(group.name, group.code);
  await groupsPage.expectGroupVisible(group.name);
  await groupsPage.deleteGroupIfPossible(group.name);
});
