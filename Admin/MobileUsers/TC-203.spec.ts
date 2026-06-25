import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_203 - Verify Delete Role Shows Yes In Listing', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser({ deleteMsgYes: true });

  await test.step('Create user with Delete Message set to Yes', async () => {
    await mobileUsersPage.createMobileUser(user);
  });

  await test.step('Verify Delete Message column shows Yes', async () => {
    await mobileUsersPage.searchUsers(user.userName);
    expect(await mobileUsersPage.getColumnValues('deleteMsg')).toContain(MobileUsersData.roles.yes);
  });
});
