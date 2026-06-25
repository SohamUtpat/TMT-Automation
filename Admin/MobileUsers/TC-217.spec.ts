import { test } from '../fixtures/mobile-users.fixture';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_217 - Verify Password Mask Unmask', async ({ mobileUsersPage }) => {
  await test.step('Fill password and verify masked by default', async () => {
    await mobileUsersPage.clickCreateUser();
    await mobileUsersPage.fillCreateUserForm({ password: TestDataGenerator.generateValidPassword() });
    await mobileUsersPage.expectPasswordMasked();
  });

  await test.step('Toggle visibility and verify password is unmasked', async () => {
    await mobileUsersPage.togglePasswordVisibility();
    await mobileUsersPage.expectPasswordUnmasked();
  });
});
