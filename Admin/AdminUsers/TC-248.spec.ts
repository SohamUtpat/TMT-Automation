import { test, expect } from '../fixtures/admin-users.fixture';
import { AdminUsersData } from '../data/AdminUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_248 - Verify Usernames Are Unique', async ({ adminUsersPage }) => {
  const user = AdminUsersData.buildValidUser();
  await adminUsersPage.createAdminUser(user);

  await adminUsersPage.clickCreateUser();
  await adminUsersPage.fillCreateUserForm({
    ...AdminUsersData.buildValidUser(),
    userName: user.userName,
  });
  await adminUsersPage.submitCreateUser({ waitForApi: false });
  await expect(adminUsersPage.page.locator('.ant-modal, .create-user-form-div, .admin-submit-button').first()).toBeVisible();
});
