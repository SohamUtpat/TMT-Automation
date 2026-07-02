import { test, expect } from '../fixtures/admin-users.fixture';
import { AdminUsersData } from '../data/AdminUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_253 - Verify First Name Over 50 Shows Validation', async ({ adminUsersPage }) => {
  await adminUsersPage.clickCreateUser();
  await adminUsersPage.fillCreateUserForm({
    ...AdminUsersData.buildValidUser(),
    firstName: TestDataGenerator.generateLongString(51),
  });
  await adminUsersPage.submitCreateUser({ waitForApi: false });
  await adminUsersPage.expectValidationMessage(AdminUsersData.validation.firstNameMaxLength);
});
