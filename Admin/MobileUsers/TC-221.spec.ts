import { test } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_221 - Verify Password Over 15 Not Accepted', async ({ mobileUsersPage }) => {
  await test.step('Submit create form with password over 15 characters', async () => {
    await mobileUsersPage.clickCreateUser();
    await mobileUsersPage.fillCreateUserForm({
      ...MobileUsersData.buildValidUser(),
      password: `${TestDataGenerator.generateLongString(16)}Aa1!`,
    });
    await mobileUsersPage.submitCreateUser();
  });

  await test.step('Verify password length validation message', async () => {
    await mobileUsersPage.expectValidationMessage(MobileUsersData.validation.passwordLength);
  });
});
