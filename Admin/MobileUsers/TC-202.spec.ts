import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_202 - Verify HQ Role Shows Yes In Listing', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser({ roleHqYes: true });

  await test.step('Create user with Role HQ set to Yes', async () => {
    await mobileUsersPage.createMobileUser(user);
  });

  await test.step('Verify Role HQ column shows Yes', async () => {
    await mobileUsersPage.searchUsers(user.userName);
    expect(await mobileUsersPage.getColumnValues('roleHq')).toContain(MobileUsersData.roles.yes);
  });
});
