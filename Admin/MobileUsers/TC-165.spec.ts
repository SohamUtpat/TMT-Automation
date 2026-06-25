import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_165 - Verify HQ Role Assignment', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser({ roleHqYes: true, deleteMsgYes: false });
  await mobileUsersPage.createMobileUser(user);

  await mobileUsersPage.searchUsers(user.userName);
  expect(await mobileUsersPage.getColumnValues('roleHq')).toContain(MobileUsersData.roles.yes);
});
