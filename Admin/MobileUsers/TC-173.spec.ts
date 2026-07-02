import { test } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_173 - Verify Maximum Last Name Length 50', async ({ mobileUsersPage }) => {
  const lastName = TestDataGenerator.generateLongString(MobileUsersData.limits.lastNameMax);
  const user = MobileUsersData.buildValidUser({ lastName });

  await test.step('Create user with 50-character last name', async () => {
    await mobileUsersPage.clickCreateUser();
    await mobileUsersPage.fillCreateUserForm(user);
    await mobileUsersPage.triggerFieldValidation();
    await mobileUsersPage.submitCreateUser();
  });

  await test.step('Verify user appears in listing', async () => {
    await mobileUsersPage.searchUsers(user.userName);
    await mobileUsersPage.expectUserVisible(user.userName);
  });
});
