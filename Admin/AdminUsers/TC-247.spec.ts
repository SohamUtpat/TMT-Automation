import { test, expect } from '../fixtures/admin-users.fixture';
import { AdminUsersData } from '../data/AdminUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_247 - Verify Search Trims Leading And Trailing Spaces', async ({ adminUsersPage }) => {
  const apiUser = await adminUsersPage.getApiListingUser();
  await adminUsersPage.searchUsers(`  ${apiUser.userName}  `);
  await adminUsersPage.expectUserVisible(apiUser.userName);
  const userNames = await adminUsersPage.getColumnValues('userName');
  expect(userNames.every((name) => name.includes(apiUser.userName) || name === apiUser.userName)).toBe(true);
});
