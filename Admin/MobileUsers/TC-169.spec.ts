import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_169 - Verify Multiple Group Selection', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser();

  await mobileUsersPage.clickCreateUser();
  await mobileUsersPage.fillCreateUserForm(user);
  await mobileUsersPage.expectHqGroupAssigned();
  await mobileUsersPage.addGroupFromDropdown('Test');
  await mobileUsersPage.submitCreateUser();
  await mobileUsersPage.expectUserSavedSuccess();

  await mobileUsersPage.searchUsers(user.userName);
  const groups = await mobileUsersPage.getColumnValues('groups');
  expect(groups[0]?.length).toBeGreaterThan(0);
});
