import { test } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_176 - Verify Maximum Username Length 50', async ({ mobileUsersPage }) => {
  const userName = (`u${TestDataGenerator.generateLongString(48)}`).slice(0, 50);
  const user = MobileUsersData.buildValidUser({ userName });

  await test.step('Create user with 50-character username', async () => {
    await mobileUsersPage.createMobileUser(user);
  });

  await test.step('Verify user appears in listing', async () => {
    await mobileUsersPage.searchUsers(user.userName);
    await mobileUsersPage.expectUserVisible(user.userName);
  });
});
