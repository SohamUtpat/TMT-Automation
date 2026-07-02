import { test } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_176 - Verify Maximum Username Length 50', async ({ mobileUsersPage }) => {
  const userName = `${TestDataGenerator.generateUniqueUsername()}${TestDataGenerator.generateLongString(30)}`.slice(
    0,
    MobileUsersData.limits.usernameMax,
  );
  const user = MobileUsersData.buildValidUser({ userName });

  await test.step('Create user with 50-character username', async () => {
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
