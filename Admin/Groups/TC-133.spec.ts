import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_133 - Verify Profile Pic Name and Code Fields Present', async ({ groupsPage }) => {
  await groupsPage.openCreateGroupModal();

  await expect(groupsPage.cameraButton()).toBeVisible();
  await expect(groupsPage.modalNameInput(groupsPage.createModal())).toBeVisible();
  await expect(groupsPage.modalCodeInput(groupsPage.createModal())).toBeVisible();
  await expect(groupsPage.profilePhotoInput()).toBeAttached();

  await groupsPage.cancelCreate();
});
