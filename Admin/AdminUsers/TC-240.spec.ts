import { test, expect } from '../fixtures/admin-users.fixture';
import { AdminUsersData } from '../data/AdminUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_240 - Verify Update Without Mobile And Profile Pic', async ({ adminUsersPage }) => {
  const user = AdminUsersData.buildValidUser({ phone: '' });
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.openEditUser(user.userName!);
  await adminUsersPage.fillCreateUserForm({
    lastName: TestDataGenerator.generateRandomLastName(),
    phone: '',
  });
  await adminUsersPage.submitUpdateUser();
  await adminUsersPage.expectUserSavedSuccess();
});
