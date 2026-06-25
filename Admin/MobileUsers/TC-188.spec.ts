import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_188 - Verify Status Active By Default', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser();

  await test.step('Create a new mobile user', async () => {
    await mobileUsersPage.createMobileUser(user);
  });

  await test.step('Verify status is Active in listing', async () => {
    await mobileUsersPage.searchUsers(user.userName);
    const statuses = await mobileUsersPage.getColumnValues('status');
    expect(statuses[0]).toBe(MobileUsersData.status.active);
  });
});
