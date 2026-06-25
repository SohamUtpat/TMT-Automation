import { test } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_207 - Verify Search Trims Spaces', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser();

  await test.step('Create a mobile user', async () => {
    await mobileUsersPage.createMobileUser(user);
  });

  await test.step('Search with leading and trailing spaces', async () => {
    await mobileUsersPage.searchUsers(`  ${user.userName}  `);
    await mobileUsersPage.expectUserVisible(user.userName);
  });
});
