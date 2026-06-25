import { test } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_179 - Verify Username Under 3 Shows Validation', async ({ mobileUsersPage }) => {
  await test.step('Submit create form with 2-character username', async () => {
    await mobileUsersPage.clickCreateUser();
    await mobileUsersPage.fillCreateUserForm({ userName: 'ab' });
    await mobileUsersPage.submitCreateUser();
  });

  await test.step('Verify username length validation message', async () => {
    await mobileUsersPage.expectValidationMessage(MobileUsersData.validation.usernameLength);
  });
});
