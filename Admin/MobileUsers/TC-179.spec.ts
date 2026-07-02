import { test } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_179 - Verify Username Under 3 Shows Validation', async ({ mobileUsersPage }) => {
  await test.step('Enter 2-character username and blur to trigger validation', async () => {
    await mobileUsersPage.clickCreateUser();
    await mobileUsersPage.fillCreateUserForm({ userName: 'ab' });
  });

  await test.step('Verify username length validation message', async () => {
    await mobileUsersPage.expectValidationMessage(MobileUsersData.validation.usernameLength);
  });
});
