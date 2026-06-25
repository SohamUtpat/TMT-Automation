import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_145 - Verify Group Name Accepts 2 to 50 Characters', async ({ groupsPage }) => {
  const group = GroupsData.uniqueGroup('Nm');

  await groupsPage.createGroup(group.name, group.code);
  await groupsPage.expectGroupVisible(group.name);

  await groupsPage.deleteGroupIfPossible(group.name);
});
