import { test, expect } from '../fixtures/admin-users.fixture';
import { AdminUsersData } from '../data/AdminUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_225 - Verify Create And Cancel Buttons', async ({ adminUsersPage }) => {
  await adminUsersPage.clickCreateUser();
  await expect(adminUsersPage.submitButton()).toBeVisible();
  await expect(adminUsersPage.cancelButton()).toBeVisible();
  await adminUsersPage.cancelForm();
});
