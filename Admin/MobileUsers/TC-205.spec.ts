import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_205 - Verify Delete Makes User Inactive', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.createMobileUser(user);

  await test.step('Confirm inactivate user from listing', async () => {
    await mobileUsersPage.searchUsers(user.userName);
    await mobileUsersPage.clickDeleteIcon(user.userName);
    await mobileUsersPage.confirmModalAction(true);
  });

  await test.step('Verify user status is Inactive in listing', async () => {
    await mobileUsersPage.searchUsers(user.userName);
    expect(await mobileUsersPage.getColumnValues('status')).toContain(MobileUsersData.status.inactive);
  });
});
