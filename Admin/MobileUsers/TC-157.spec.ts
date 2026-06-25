import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test.describe('TC_AP_157 - Create User Form Fields', () => {
  test('Verify create user form has required fields', async ({ mobileUsersPage }) => {
    await test.step('Open create user form', async () => {
      await mobileUsersPage.clickCreateUser();
    });

    await test.step('Verify profile and basic fields', async () => {
      await expect(mobileUsersPage.profileImage()).toBeVisible();
      await expect(mobileUsersPage.profileUploadInput()).toBeAttached();
      await expect(mobileUsersPage.firstNameInput()).toBeVisible();
      await expect(mobileUsersPage.lastNameInput()).toBeVisible();
      await expect(mobileUsersPage.userNameInput()).toBeVisible();
      await expect(mobileUsersPage.emailInput()).toBeVisible();
      await expect(mobileUsersPage.passwordInput()).toBeVisible();
      await expect(mobileUsersPage.phoneInput()).toBeVisible();
    });

    await test.step('Verify language, roles, and group selection', async () => {
      await mobileUsersPage.expectFormFieldVisible(/Language/i);
      await mobileUsersPage.expectFormFieldVisible(/Delete Message/i);
      await mobileUsersPage.expectFormFieldVisible(/Role HQ/i);
      await expect(mobileUsersPage.groupSection()).toBeVisible();
    });

    await test.step('Cancel form', async () => {
      await mobileUsersPage.cancelButton().click();
      await mobileUsersPage.expectListingLoaded();
    });
  });
});
