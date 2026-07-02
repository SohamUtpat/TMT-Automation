import { test, expect } from '../fixtures/admin-users.fixture';
import { AdminUsersData } from '../data/AdminUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_245 - Verify Edit Icon Opens Update Form', async ({ adminUsersPage }) => {
  const apiUser = await adminUsersPage.getApiListingUser();
  await adminUsersPage.openEditUser(apiUser.userName);
  await adminUsersPage.expectEditFormLoaded();
  await adminUsersPage.cancelForm();
});
