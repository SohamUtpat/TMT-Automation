import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_134 - Verify Name Minimum Two Characters Validation', async ({ groupsPage }) => {
  await groupsPage.openCreateGroupModal();
  await groupsPage.fillCreateForm('A', 'ValidCode12');
  await groupsPage.submitCreate();

  await groupsPage.expectValidationMessage(GroupsData.validation.nameMinLengthMessage);
  await groupsPage.cancelCreate();
});
