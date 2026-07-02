import { test, expect } from '../fixtures/admin-users.fixture';
import { AdminUsersData } from '../data/AdminUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_262 - Verify Mobile Over 15 Shows Validation', async ({ adminUsersPage }) => {
  await adminUsersPage.clickCreateUser();
  await adminUsersPage.fillCreateUserForm({
    ...AdminUsersData.buildValidUser(),
    phone: '1'.repeat(16),
  });
  await adminUsersPage.submitCreateUser({ waitForApi: false });
  await adminUsersPage.expectValidationMessage(AdminUsersData.validation.mobileMaxLength);
});
