import { test, expect } from '../fixtures/admin-users.fixture';
import { AdminUsersData } from '../data/AdminUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_230 - Verify Default Status Active On Create', async ({ adminUsersPage }) => {
  const user = AdminUsersData.buildValidUser();
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.searchUsers(user.userName);

  const statuses = await adminUsersPage.getColumnValues('status');
  expect(statuses[0]).toBe(AdminUsersData.status.active);

  const apiUser = (await adminUsersPage.fetchAdminUsers({ search: user.userName })).users[0];
  expect(apiUser?.status).toBe('1');
});
