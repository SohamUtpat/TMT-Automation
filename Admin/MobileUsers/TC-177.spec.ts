import { test } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_177 - Verify Minimum Username Length 3', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser({ userName: 'abc' });

  await test.step('Create user with 3-character username', async () => {
    await mobileUsersPage.createMobileUser(user);
  });

  await test.step('Verify user appears in listing', async () => {
    await mobileUsersPage.searchUsers(user.userName);
    await mobileUsersPage.expectUserVisible(user.userName);
  });
});
