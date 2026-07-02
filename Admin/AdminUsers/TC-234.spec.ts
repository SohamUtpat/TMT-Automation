import { test, expect } from '../fixtures/admin-users.fixture';
import { AdminUsersData } from '../data/AdminUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_234 - Verify Edit Form Matches Create Form Fields', async ({ adminUsersPage }) => {
  const apiUser = await adminUsersPage.getApiListingUser();
  await adminUsersPage.openEditUser(apiUser.userName);

  await expect(adminUsersPage.firstNameInput()).toBeVisible();
  await expect(adminUsersPage.lastNameInput()).toBeVisible();
  await expect(adminUsersPage.userNameInput()).toBeDisabled();
  await expect(adminUsersPage.emailInput()).toBeVisible();
  await expect(adminUsersPage.phoneInput()).toBeVisible();
  await adminUsersPage.expectFormFieldVisible(/Language/i);
  await expect(adminUsersPage.submitButton()).toBeVisible();
  await expect(adminUsersPage.cancelButton()).toBeVisible();
  await adminUsersPage.cancelForm();
});
