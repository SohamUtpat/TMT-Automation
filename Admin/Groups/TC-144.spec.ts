import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_144 - Verify Group Name Minimum 2 Characters', async ({ groupsPage }) => {
  await groupsPage.openCreateGroupModal();
  await groupsPage.fillCreateForm('A', 'ValidCode12');
  await groupsPage.submitCreate();

  await groupsPage.expectValidationMessage(GroupsData.validation.nameMinLengthMessage);
  await groupsPage.cancelCreate();
});
