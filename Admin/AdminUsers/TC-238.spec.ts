import { test, expect } from '../fixtures/admin-users.fixture';
import { AdminUsersData } from '../data/AdminUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_238 - Verify User Details Can Be Edited And Updated', async ({ adminUsersPage }) => {
  const user = AdminUsersData.buildValidUser();
  await adminUsersPage.createAdminUser(user);

  const updatedFirst = TestDataGenerator.generateRandomName();
  await adminUsersPage.openEditUser(user.userName!);
  await adminUsersPage.fillCreateUserForm({ firstName: updatedFirst });
  await adminUsersPage.submitUpdateUser();
  await adminUsersPage.expectUserSavedSuccess();

  await adminUsersPage.searchUsers(user.userName!);
  const names = await adminUsersPage.getColumnValues('name');
  expect(names[0]).toContain(updatedFirst);
});
