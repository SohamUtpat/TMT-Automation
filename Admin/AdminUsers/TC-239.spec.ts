import { test, expect } from '../fixtures/admin-users.fixture';
import { AdminUsersData } from '../data/AdminUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_239 - Verify User Saved Successfully Message On Update', async ({ adminUsersPage }) => {
  const apiUser = await adminUsersPage.getApiListingUser();
  await adminUsersPage.openEditUser(apiUser.userName);
  await adminUsersPage.fillCreateUserForm({
    firstName: TestDataGenerator.generateRandomName(),
  });
  await adminUsersPage.submitUpdateUser();
  await expect(adminUsersPage.toast(AdminUsersData.messages.userSaved)).toBeVisible();
});
