import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_204 - Verify Delete Icon Opens Confirmation', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.createMobileUser(user);

  await test.step('Click delete icon and verify confirmation modal', async () => {
    await mobileUsersPage.searchUsers(user.userName);
    await mobileUsersPage.clickDeleteIcon(user.userName);
    await expect(mobileUsersPage.confirmModal()).toContainText(MobileUsersData.messages.inactivateConfirm);
  });

  await test.step('Cancel delete action', async () => {
    await mobileUsersPage.confirmModalAction(false);
    await mobileUsersPage.expectUserVisible(user.userName);
  });
});
