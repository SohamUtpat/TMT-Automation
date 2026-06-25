import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_201 - Verify Default Active Status In Listing', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser();

  await test.step('Create a new mobile user', async () => {
    await mobileUsersPage.createMobileUser(user);
  });

  await test.step('Verify Active status in listing', async () => {
    await mobileUsersPage.searchUsers(user.userName);
    expect(await mobileUsersPage.getColumnValues('status')).toContain(MobileUsersData.status.active);
  });
});
