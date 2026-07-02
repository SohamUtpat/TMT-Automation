import { test } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_181 - Verify Mobile Over 15 Shows Validation', async ({ mobileUsersPage }) => {
  await test.step('Submit create form with 16-digit mobile number', async () => {
    await mobileUsersPage.clickCreateUser();
    await mobileUsersPage.fillCreateUserForm({ phone: '1234567890123456' });
    await mobileUsersPage.submitCreateUser({ waitForApi: false });
  });

  await test.step('Verify mobile max length validation message', async () => {
    await mobileUsersPage.expectValidationMessage(MobileUsersData.validation.mobileMaxLength);
  });
});
