import { test } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_182 - Verify Mobile Rejects Invalid Characters', async ({ mobileUsersPage }) => {
  await test.step('Submit create form with invalid mobile number', async () => {
    await mobileUsersPage.clickCreateUser();
    await mobileUsersPage.fillCreateUserForm({ phone: TestDataGenerator.generateInvalidPhone() });
    await mobileUsersPage.submitCreateUser();
  });

  await test.step('Verify invalid mobile validation message', async () => {
    await mobileUsersPage.expectValidationMessage(MobileUsersData.validation.invalidMobile);
  });
});
