import { test } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_184 - Verify Doraku Over 20 Shows Validation', async ({ mobileUsersPage }) => {
  await mobileUsersPage.clickCreateUser();
  if (!(await mobileUsersPage.dorakuInput().isVisible())) {
    test.skip(true, 'Doraku field hidden — integration disabled');
  }

  await test.step('Submit create form with 21-character Doraku code', async () => {
    await mobileUsersPage.fillCreateUserForm({
      dorakuCode: TestDataGenerator.generateLongString(21),
    });
    await mobileUsersPage.submitCreateUser({ waitForApi: false });
  });

  await test.step('Verify Doraku max length validation message', async () => {
    await mobileUsersPage.expectValidationMessage(MobileUsersData.validation.dorakuMaxLength);
  });
});
