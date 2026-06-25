import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_146 - Verify Group Code Maximum 15 Characters', async ({ groupsPage }) => {
  const longCode = 'C'.repeat(GroupsData.validation.codeMaxLength + 1);

  await groupsPage.openCreateGroupModal();
  await groupsPage.fillCreateForm('ValidGroupName', longCode);
  await groupsPage.submitCreate();

  await groupsPage.expectValidationMessage(GroupsData.validation.codeMinLengthMessage);
  await groupsPage.cancelCreate();
});
