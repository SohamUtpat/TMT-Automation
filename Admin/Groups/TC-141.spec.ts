import path from 'path';
import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_141 - Verify Profile Photo Can Be Replaced', async ({ groupsPage }) => {
  await groupsPage.openCreateGroupModal();

  await groupsPage.uploadProfilePhoto(path.resolve(GroupsData.testAssets.validPng));
  await groupsPage.uploadProfilePhoto(path.resolve(GroupsData.testAssets.replacePng));

  await expect(groupsPage.createModal()).toBeVisible();
  await groupsPage.cancelCreate();
});
