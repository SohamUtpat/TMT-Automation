import { test, expect } from '../fixtures/admin-users.fixture';
import { AdminUsersData } from '../data/AdminUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_237 - Verify Edit Form Has Update And Cancel Buttons', async ({ adminUsersPage }) => {
  const apiUser = await adminUsersPage.getApiListingUser();
  await adminUsersPage.openEditUser(apiUser.userName);
  await expect(adminUsersPage.submitButton()).toBeVisible();
  await expect(adminUsersPage.cancelButton()).toBeVisible();
  await adminUsersPage.cancelForm();
});
