import { test, expect } from '../fixtures/admin-users.fixture';
import { AdminUsersData } from '../data/AdminUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_254 - Verify Last Name Maximum Length 50', async ({ adminUsersPage }) => {
  const user = AdminUsersData.buildValidUser({
    lastName: TestDataGenerator.generateLongString(50),
  });
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.searchUsers(user.userName!);
  await adminUsersPage.expectUserVisible(user.userName!);
});
