import { test, expect } from '../fixtures/admin-users.fixture';
import { AdminUsersData } from '../data/AdminUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_250 - Verify Profile Photo Format Validation', async ({ adminUsersPage }) => {
  await adminUsersPage.clickCreateUser();
  await adminUsersPage.uploadProfilePhoto(AdminUsersData.testAssets.invalidPdf);
  await adminUsersPage.expectUploadError(AdminUsersData.validation.invalidImageFormat);
  await adminUsersPage.cancelForm();
});
