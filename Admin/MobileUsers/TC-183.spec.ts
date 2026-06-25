import { test } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_183 - Verify Doraku Code Max Length 20', async ({ mobileUsersPage }) => {
  await mobileUsersPage.clickCreateUser();
  if (!(await mobileUsersPage.dorakuInput().isVisible())) {
    test.skip(true, 'Doraku field hidden — integration disabled');
  }

  const user = MobileUsersData.buildValidUser({
    dorakuCode: TestDataGenerator.generateLongString(MobileUsersData.limits.dorakuMax),
  });

  await test.step('Create user with 20-character Doraku code', async () => {
    await mobileUsersPage.fillCreateUserForm(user);
    await mobileUsersPage.submitCreateUser();
    await mobileUsersPage.expectUserSavedSuccess();
  });
});
