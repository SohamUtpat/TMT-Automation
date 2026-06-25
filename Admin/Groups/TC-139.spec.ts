import path from 'path';
import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_139 - Verify Profile Photo Minimum 1KB Validation', async ({ groupsPage }) => {
  await groupsPage.openCreateGroupModal();
  await groupsPage.uploadProfilePhoto(path.resolve(GroupsData.testAssets.tinyPng));

  await groupsPage.expectUploadError(GroupsData.validation.imageTooSmall);
  await groupsPage.cancelCreate();
});
