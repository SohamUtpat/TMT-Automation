import { test, expect } from '../fixtures/admin-users.fixture';
import { AdminUsersData } from '../data/AdminUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_232 - Verify User Cannot Make Themselves Inactive', async ({ adminUsersPage }) => {
  const loggedIn = await adminUsersPage.getLoggedInAdmin();
  await adminUsersPage.openEditUser(loggedIn.userName);
  await expect(adminUsersPage.statusRadioGroup()).toHaveCount(0);
  await adminUsersPage.cancelForm();
});
