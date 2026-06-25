import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_166 - Verify Delete Role Assignment', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser({ deleteMsgYes: true, roleHqYes: false });
  await mobileUsersPage.createMobileUser(user);

  await mobileUsersPage.searchUsers(user.userName);
  expect(await mobileUsersPage.getColumnValues('deleteMsg')).toContain(MobileUsersData.roles.yes);
});
