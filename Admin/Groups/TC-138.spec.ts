import path from 'path';
import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_138 - Verify Profile Photo Maximum 5MB Validation', async ({ groupsPage }) => {
  await groupsPage.openCreateGroupModal();
  await groupsPage.uploadProfilePhoto(path.resolve(GroupsData.testAssets.largeJpg));

  await groupsPage.expectUploadError(GroupsData.validation.imageTooLarge);
  await groupsPage.cancelCreate();
});
