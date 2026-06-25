import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_192 - Verify Edit Keeps Same Username', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.createMobileUser(user);

  await test.step('Open edit form and verify username value is unchanged', async () => {
    await mobileUsersPage.searchUsers(user.userName);
    await mobileUsersPage.openEditUser(user.userName);
    await expect(mobileUsersPage.userNameInput()).toHaveValue(user.userName);
  });
});
