import { test } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_185 - Verify Doraku Accepts Integers Only', async ({ mobileUsersPage }) => {
  await mobileUsersPage.clickCreateUser();
  if (!(await mobileUsersPage.dorakuInput().isVisible())) {
    test.skip(true, 'Doraku field hidden — integration disabled');
  }

  await test.step('Submit create form with invalid Doraku code', async () => {
    await mobileUsersPage.fillCreateUserForm({ dorakuCode: 'abc@#$' });
    await mobileUsersPage.submitCreateUser({ waitForApi: false });
  });

  await test.step('Verify invalid Doraku validation message', async () => {
    await mobileUsersPage.expectValidationMessage(MobileUsersData.validation.invalidDoraku);
  });
});
