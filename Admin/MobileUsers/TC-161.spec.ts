import { test, expect } from '../fixtures/mobile-users.fixture';

test('TC_AP_161 - Verify Default HQ Group Assigned', async ({ mobileUsersPage }) => {
  await mobileUsersPage.clickCreateUser();
  await mobileUsersPage.expectHqGroupAssigned();
  await mobileUsersPage.cancelButton().click();
  await mobileUsersPage.expectListingLoaded();
});
