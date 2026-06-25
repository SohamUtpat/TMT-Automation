import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_153 - Verify Group Name and Code Must Be Unique', async ({ groupsPage }) => {
  const group = GroupsData.uniqueGroup('Dup');

  await groupsPage.createGroup(group.name, group.code);
  await groupsPage.openCreateGroupModal();
  await groupsPage.fillCreateForm(group.name, group.code);
  await groupsPage.submitCreateAndExpectDuplicate();
  await groupsPage.cancelCreate();
  await groupsPage.deleteGroupIfPossible(group.name);
});
