import { test } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_219 - Verify Password Not On Update Form', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.createMobileUser(user);

  await test.step('Open edit form and verify password field is absent', async () => {
    await mobileUsersPage.searchUsers(user.userName);
    await mobileUsersPage.openEditUser(user.userName);
    await mobileUsersPage.expectPasswordFieldVisible(false);
  });
});
