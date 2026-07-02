import { test, expect } from '../fixtures/admin-users.fixture';
import { AdminUsersData } from '../data/AdminUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_235 - Verify Status Can Be Changed On Edit', async ({ adminUsersPage }) => {
  const user = AdminUsersData.buildValidUser();
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.openEditUser(user.userName!);
  await expect(adminUsersPage.statusRadioGroup()).toBeVisible();
  await adminUsersPage.selectStatus(false);
  await adminUsersPage.submitUpdateUser();
  await adminUsersPage.expectUserSavedSuccess();
});
