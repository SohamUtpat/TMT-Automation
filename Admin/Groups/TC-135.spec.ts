import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_135 - Verify Name Rejects Special Characters', async ({ groupsPage }) => {
  await groupsPage.openCreateGroupModal();
  await groupsPage.fillCreateForm('Test@#$Name', 'ValidCode12');
  await groupsPage.submitCreate();

  await groupsPage.expectValidationMessage(GroupsData.validation.nameSpecialCharsMessage);
  await groupsPage.cancelCreate();
});
