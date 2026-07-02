import { test, expect } from '../fixtures/admin-users.fixture';
import { AdminUsersData } from '../data/AdminUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_231 - Verify Inactive User Status On Listing', async ({ adminUsersPage }) => {
  const user = AdminUsersData.buildValidUser();
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.openEditUser(user.userName!);
  await adminUsersPage.selectStatus(false);
  await adminUsersPage.submitUpdateUser();
  await adminUsersPage.expectListingLoaded();

  await adminUsersPage.searchUsers(user.userName!);
  const statuses = await adminUsersPage.getColumnValues('status');
  expect(statuses[0]).toBe(AdminUsersData.status.inactive);
});
