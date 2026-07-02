import { test, expect } from '../fixtures/admin-users.fixture';
import { AdminUsersData } from '../data/AdminUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_241 - Verify Admin Listing Columns And Data', async ({ adminUsersPage }) => {
  for (const col of AdminUsersData.listingColumns) {
    await adminUsersPage.expectColumnHeaderVisible(col);
  }

  const apiUser = await adminUsersPage.getApiListingUser();
  await adminUsersPage.prepareUserFromApi(apiUser);

  const userNames = await adminUsersPage.getColumnValues('userName');
  expect(userNames).toContain(apiUser.userName);

  const emails = await adminUsersPage.getColumnValues('email');
  expect(emails.some((email) => email.includes(apiUser.email.split('@')[0]))).toBe(true);
});
