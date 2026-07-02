import { test, expect } from '../fixtures/admin-users.fixture';
import { AdminUsersData } from '../data/AdminUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_243 - Verify Delete Opens Confirmation And Inactivates User', async ({ adminUsersPage }) => {
  const user = AdminUsersData.buildValidUser();
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.searchUsers(user.userName!);

  await adminUsersPage.clickDeleteIcon(user.userName!);
  await expect(adminUsersPage.confirmModal()).toContainText(/delete user/i);
  await adminUsersPage.confirmModalAction(true);
  await expect(adminUsersPage.toast(/inactivated|deleted/i)).toBeVisible({ timeout: 30_000 });

  await adminUsersPage.searchUsers(user.userName!);
  const statuses = await adminUsersPage.getColumnValues('status');
  expect(statuses[0]).toBe(AdminUsersData.status.inactive);
});
