import { test, expect } from '../fixtures/admin-users.fixture';
import { AdminUsersData } from '../data/AdminUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_257 - Verify Username Maximum Length 50', async ({ adminUsersPage }) => {
  const user = AdminUsersData.buildValidUser({
    userName: `u${TestDataGenerator.generateLongString(48)}`.slice(0, 50),
  });
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.searchUsers(user.userName!);
  await adminUsersPage.expectUserVisible(user.userName!);
});
