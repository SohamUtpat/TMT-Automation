import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_136 - Verify Code Minimum Two Characters Validation', async ({ groupsPage }) => {
  await groupsPage.openCreateGroupModal();
  await groupsPage.fillCreateForm('ValidName', 'A');
  await groupsPage.submitCreate();

  await groupsPage.expectValidationMessage(GroupsData.validation.codeMinLengthMessage);
  await groupsPage.cancelCreate();
});
