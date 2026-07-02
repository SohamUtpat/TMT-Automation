import { test, expect } from '../fixtures/admin-users.fixture';
import { AdminUsersData } from '../data/AdminUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_228 - Verify Created User Appears In Listing', async ({ adminUsersPage }) => {
  const user = AdminUsersData.buildValidUser();
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.searchUsers(user.userName);
  await adminUsersPage.expectUserVisible(user.userName);

  const apiUser = (await adminUsersPage.fetchAdminUsers({ search: user.userName })).users[0];
  expect(apiUser?.userName).toBe(user.userName);
});
