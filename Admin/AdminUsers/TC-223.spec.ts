import { test, expect } from '../fixtures/admin-users.fixture';
import { AdminUsersData } from '../data/AdminUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_223 - Verify Text Fields Trim Spaces', async ({ adminUsersPage }) => {
  const user = AdminUsersData.buildValidUser();

  await adminUsersPage.clickCreateUser();
  await adminUsersPage.fillCreateUserForm({
    ...user,
    firstName: `  ${user.firstName}  `,
    lastName: `  ${user.lastName}  `,
    userName: `  ${user.userName}  `,
    email: `  ${user.email}  `,
  });
  await adminUsersPage.submitCreateUser();

  await adminUsersPage.searchUsers(user.userName);
  await adminUsersPage.expectUserVisible(user.userName);
});
