import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_137 - Verify Code Rejects Special Characters', async ({ groupsPage }) => {
  await groupsPage.openCreateGroupModal();
  await groupsPage.fillCreateForm('ValidName', 'Code@#$');
  await groupsPage.submitCreate();

  await groupsPage.expectValidationMessage(GroupsData.validation.codeSpecialCharsMessage);
  await groupsPage.cancelCreate();
});
