import { test } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_144 - Verify Group Name Minimum 2 Characters', async ({ groupsPage }) => {
  const invalidName = 'A'.repeat(GroupsData.validation.nameMinLength - 1);

  await groupsPage.openCreateGroupModal();
  await groupsPage.fillCreateGroupName(invalidName);

  await groupsPage.expectValidationMessage(GroupsData.validation.nameMinLengthMessage);
  await groupsPage.cancelCreate();
});
