import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_143 - Verify Group Name Maximum 50 Characters', async ({ groupsPage }) => {
  const longName = 'A'.repeat(GroupsData.validation.nameMaxLength + 1);

  await groupsPage.openCreateGroupModal();
  await groupsPage.fillCreateForm(longName, 'ValidCode12');
  await groupsPage.submitCreate();

  await groupsPage.expectValidationMessage(GroupsData.validation.nameMinLengthMessage);
  await groupsPage.cancelCreate();
});
