import { test } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_180 - Verify Maximum Mobile Length 15', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser({ phone: '123456789012345' });

  await test.step('Create user with 15-digit mobile number', async () => {
    await mobileUsersPage.createMobileUser(user);
  });

  await test.step('Verify user appears in listing', async () => {
    await mobileUsersPage.searchUsers(user.userName);
    await mobileUsersPage.expectUserVisible(user.userName);
  });
});
