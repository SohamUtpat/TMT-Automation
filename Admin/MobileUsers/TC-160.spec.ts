import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_160 - Verify Usernames Are Unique', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.createMobileUserViaApi(user);

  await mobileUsersPage.clickCreateUser();
  await mobileUsersPage.fillCreateUserForm({
    ...MobileUsersData.buildValidUser(),
    userName: user.userName,
  });
  await mobileUsersPage.submitCreateUser({ waitForApi: false });

  await expect(mobileUsersPage.firstNameInput()).toBeVisible({ timeout: 15_000 });
  await expect(mobileUsersPage.page.locator('.ant-message-notice-content').first()).toBeVisible({
    timeout: 15_000,
  });
});
