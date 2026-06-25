import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_195 - Verify HQ Group Not Editable On Edit', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.createMobileUser(user);

  await test.step('Open edit form and verify HQ group cannot be removed', async () => {
    await mobileUsersPage.searchUsers(user.userName);
    await mobileUsersPage.openEditUser(user.userName);
    await mobileUsersPage.expectHqGroupAssigned();
    await expect(mobileUsersPage.hqGroupChip().locator('.crossIconCss')).toHaveCount(0);
  });

  await test.step('Save edit form successfully', async () => {
    await mobileUsersPage.submitUpdateUser();
    await mobileUsersPage.expectUserSavedSuccess();
  });
});
