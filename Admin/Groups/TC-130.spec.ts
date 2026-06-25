import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_130 - Verify Create Group Form Fields', async ({ groupsPage }) => {
  await groupsPage.openCreateGroupModal();

  await expect(groupsPage.page.getByText(GroupsData.createModal.title)).toBeVisible();
  await expect(groupsPage.page.getByText(GroupsData.createModal.nameLabel, { exact: true })).toBeVisible();
  await expect(groupsPage.page.getByText(GroupsData.createModal.codeLabel, { exact: true })).toBeVisible();
  await expect(groupsPage.cameraButton()).toBeVisible();
  await expect(groupsPage.createModal().getByRole('button', { name: 'Create' })).toBeVisible();
  await expect(groupsPage.createModal().getByRole('button', { name: 'Cancel' })).toBeVisible();

  await groupsPage.cancelCreate();
});
