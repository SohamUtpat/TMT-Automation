import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_149 - Verify Group Creation Blocked With Invalid Inputs', async ({ groupsPage }) => {
  await groupsPage.openCreateGroupModal();
  await groupsPage.fillCreateForm('A', '@');
  await groupsPage.submitCreate();

  await groupsPage.expectValidationMessage(/not valid/i);
  await expect(groupsPage.createModal()).toBeVisible();

  await groupsPage.cancelCreate();
});
