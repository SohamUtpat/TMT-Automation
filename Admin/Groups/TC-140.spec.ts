import path from 'path';
import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_140 - Verify Profile Photo Accepts Only JPG JPEG PNG', async ({ groupsPage }) => {
  await groupsPage.openCreateGroupModal();
  await groupsPage.uploadProfilePhoto(path.resolve(GroupsData.testAssets.invalidPdf));

  await groupsPage.expectUploadError(GroupsData.validation.invalidImageFormat);
  await groupsPage.cancelCreate();
});
