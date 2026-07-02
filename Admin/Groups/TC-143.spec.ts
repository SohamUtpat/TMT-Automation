import { test } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_143 - Verify Group Name Maximum 50 Characters', async ({ groupsPage }) => {
  const invalidName = 'A'.repeat(GroupsData.validation.nameMaxLength + 1);

  await groupsPage.openCreateGroupModal();
  await groupsPage.fillCreateGroupName(invalidName);

  await groupsPage.expectValidationMessage(GroupsData.validation.nameMinLengthMessage);
  await groupsPage.cancelCreate();
});
