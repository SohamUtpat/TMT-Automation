import { test, expect } from '../fixtures/admin-users.fixture';
import { AdminUsersData } from '../data/AdminUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_224 - Verify Required Fields Except Mobile And Profile Pic', async ({ adminUsersPage }) => {
  const user = AdminUsersData.buildValidUser({ phone: '' });

  await adminUsersPage.clickCreateUser();
  await adminUsersPage.fillCreateUserForm(user);
  await adminUsersPage.submitCreateUser();
  await adminUsersPage.searchUsers(user.userName);
  await adminUsersPage.expectUserVisible(user.userName);

  await adminUsersPage.clickCreateUser();
  await adminUsersPage.fillCreateUserForm({
    firstName: '',
    lastName: '',
    userName: '',
    email: '',
  });
  await adminUsersPage.submitCreateUser({ waitForApi: false });
  await adminUsersPage.expectValidationMessage(AdminUsersData.validation.required);
  await expect(adminUsersPage.firstNameInput()).toBeVisible();
});
