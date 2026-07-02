import { test, expect } from '../fixtures/groups.fixture';

test('TC_AP_151 - Verify Total Members Opens Members List', async ({ groupsPage }) => {
  const group = await groupsPage.prepareGroupWithMembersFromApi();  await groupsPage.openMembersList(group.name);

  await expect(groupsPage.backButton()).toBeVisible();
  await expect(groupsPage.membersPageTitle(group.name)).toBeVisible();
  await expect(groupsPage.removeUsersButton()).toBeVisible();
  await expect(groupsPage.table()).toBeVisible();
});
