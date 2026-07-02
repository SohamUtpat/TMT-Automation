import { test, expect } from '../fixtures/admin-users.fixture';
import { AdminUsersData } from '../data/AdminUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test.describe('TC_AP_222 - Create Admin User Form Fields', () => {
  test('Verify create admin user form has required fields', async ({ adminUsersPage }) => {
    await adminUsersPage.clickCreateUser();

    await expect(adminUsersPage.profileImage()).toBeVisible();
    await expect(adminUsersPage.profileUploadInput()).toBeAttached();
    await expect(adminUsersPage.userNameInput()).toBeVisible();
    await expect(adminUsersPage.firstNameInput()).toBeVisible();
    await expect(adminUsersPage.lastNameInput()).toBeVisible();
    await expect(adminUsersPage.emailInput()).toBeVisible();
    await expect(adminUsersPage.phoneInput()).toBeVisible();
    await adminUsersPage.expectFormFieldVisible(/Language/i);

    const dorakuVisible = await adminUsersPage.page
      .locator('.admin-radio-lables, .admin-radio-labels')
      .filter({ hasText: /Doraku/i })
      .isVisible()
      .catch(() => false);
    if (dorakuVisible) {
      await adminUsersPage.expectFormFieldVisible(/Doraku/i);
    }

    await adminUsersPage.cancelButton().click();
    await adminUsersPage.expectListingLoaded();
  });
});
