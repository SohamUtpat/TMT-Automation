import { test } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_174 - Verify Last Name Over 50 Shows Validation', async ({ mobileUsersPage }) => {
  await test.step('Submit create form with 51-character last name', async () => {
    await mobileUsersPage.clickCreateUser();
    await mobileUsersPage.fillCreateUserForm({
      lastName: TestDataGenerator.generateLongString(51),
    });
    await mobileUsersPage.submitCreateUser();
  });

  await test.step('Verify max length validation message', async () => {
    await mobileUsersPage.expectValidationMessage(MobileUsersData.validation.lastNameMaxLength);
  });
});
