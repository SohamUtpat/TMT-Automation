import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_162 - Verify HQ Group Pre-Assigned On Create', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.createMobileUser(user);

  await mobileUsersPage.searchUsers(user.userName);
  const groups = await mobileUsersPage.getColumnValues('groups');
  expect(groups.some((g) => g.includes(MobileUsersData.hqGroupCode))).toBe(true);
});
