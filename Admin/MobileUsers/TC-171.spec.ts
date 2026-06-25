import { test } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_171 - Verify Maximum Name Length 50', async ({ mobileUsersPage }) => {
  const name = TestDataGenerator.generateLongString(MobileUsersData.limits.nameMax);
  const user = MobileUsersData.buildValidUser({ firstName: name });

  await test.step('Create user with 50-character first name', async () => {
    await mobileUsersPage.createMobileUser(user);
  });

  await test.step('Verify user appears in listing', async () => {
    await mobileUsersPage.searchUsers(user.userName);
    await mobileUsersPage.expectUserVisible(user.userName);
  });
});
