import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_147 - Verify Group Code Minimum 2 Characters', async ({ groupsPage }) => {
  await groupsPage.openCreateGroupModal();
  await groupsPage.fillCreateForm('ValidGroupName', 'A');
  await groupsPage.submitCreate();

  await groupsPage.expectValidationMessage(GroupsData.validation.codeMinLengthMessage);
  await groupsPage.cancelCreate();
});
