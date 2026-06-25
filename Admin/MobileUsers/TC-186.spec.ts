import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_186 - Verify User Cannot Be Created With Invalid Inputs', async ({ mobileUsersPage }) => {
  await test.step('Submit create form with multiple invalid fields', async () => {
    await mobileUsersPage.clickCreateUser();
    await mobileUsersPage.fillCreateUserForm({
      firstName: '123',
      lastName: '@@@',
      userName: 'ab',
      email: TestDataGenerator.generateInvalidEmail(),
      password: 'weak',
    });
    await mobileUsersPage.submitCreateUser();
  });

  await test.step('Verify form remains open and user is not created', async () => {
    await expect(mobileUsersPage.firstNameInput()).toBeVisible();
    await expect(mobileUsersPage.page).toHaveURL(new RegExp(MobileUsersData.paths.create));
  });
});
