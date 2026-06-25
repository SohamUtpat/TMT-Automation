import { test, expect } from '../fixtures/groups.fixture';
test('TC_AP_131 - Verify Name and Code Mandatory Profile Pic Optional', async ({ groupsPage }) => {
  await groupsPage.openCreateGroupModal();

  await groupsPage.expectRequiredFieldMarkers(groupsPage.createModal());

  await groupsPage.submitCreate();
  await groupsPage.page.waitForTimeout(500);

  await expect(groupsPage.createModal()).toBeVisible();

  await groupsPage.cancelCreate();
});
