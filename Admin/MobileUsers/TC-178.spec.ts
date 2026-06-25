import { test } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_178 - Verify Username Over 50 Shows Validation', async ({ mobileUsersPage }) => {
  await test.step('Submit create form with 51-character username', async () => {
    await mobileUsersPage.clickCreateUser();
    await mobileUsersPage.fillCreateUserForm({
      userName: TestDataGenerator.generateLongString(51),
    });
    await mobileUsersPage.submitCreateUser();
  });

  await test.step('Verify username length validation message', async () => {
    await mobileUsersPage.expectValidationMessage(MobileUsersData.validation.usernameLength);
  });
});
