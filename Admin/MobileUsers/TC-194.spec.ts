import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_194 - Verify Status Field On Edit Form', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.createMobileUser(user);

  await test.step('Open edit form and set status to Inactive', async () => {
    await mobileUsersPage.searchUsers(user.userName);
    await mobileUsersPage.openEditUser(user.userName);
    await expect(mobileUsersPage.page.locator('#status')).toBeVisible();
    await mobileUsersPage.selectStatus(false);
    await mobileUsersPage.submitUpdateUser();
    await mobileUsersPage.expectUserSavedSuccess();
  });

  await test.step('Verify status shows Inactive in listing', async () => {
    await mobileUsersPage.searchUsers(user.userName);
    const statuses = await mobileUsersPage.getColumnValues('status');
    expect(statuses[0]).toBe(MobileUsersData.status.inactive);
  });
});
