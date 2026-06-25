import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_159 - Verify Optional vs Required Fields', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser({ phone: '' });

  await test.step('Create user without optional mobile number', async () => {
    await mobileUsersPage.createMobileUser(user);
    await mobileUsersPage.searchUsers(user.userName);
    await mobileUsersPage.expectUserVisible(user.userName);
  });

  await test.step('Reject create when required fields are empty', async () => {
    await mobileUsersPage.clickCreateUser();
    await mobileUsersPage.fillCreateUserForm({
      firstName: '',
      lastName: '',
      userName: '',
      email: '',
      password: '',
    });
    await mobileUsersPage.submitCreateUser();
    await mobileUsersPage.expectValidationMessage(MobileUsersData.validation.required);
    await expect(mobileUsersPage.firstNameInput()).toBeVisible();
  });
});
