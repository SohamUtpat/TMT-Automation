import { test } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_175 - Verify No Minimum Name Length', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser({ firstName: 'A', lastName: 'B' });

  await test.step('Create user with single-character name fields', async () => {
    await mobileUsersPage.createMobileUser(user);
  });

  await test.step('Verify user appears in listing', async () => {
    await mobileUsersPage.searchUsers(user.userName);
    await mobileUsersPage.expectUserVisible(user.userName);
  });
});
