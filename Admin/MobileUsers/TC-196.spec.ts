import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_196 - Verify Role Can Be Changed On Edit', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser({ roleHqYes: false, deleteMsgYes: false });
  await mobileUsersPage.createMobileUser(user);

  await test.step('Update Role HQ and Delete Message on edit form', async () => {
    await mobileUsersPage.searchUsers(user.userName);
    await mobileUsersPage.openEditUser(user.userName);
    await mobileUsersPage.selectRadioByLabel(/Role HQ/i, 'Yes');
    await mobileUsersPage.selectRadioByLabel(/Delete Message/i, 'Yes');
    await mobileUsersPage.submitUpdateUser();
    await mobileUsersPage.expectUserSavedSuccess();
  });

  await test.step('Verify updated roles in listing', async () => {
    await mobileUsersPage.searchUsers(user.userName);
    expect(await mobileUsersPage.getColumnValues('roleHq')).toContain(MobileUsersData.roles.yes);
    expect(await mobileUsersPage.getColumnValues('deleteMsg')).toContain(MobileUsersData.roles.yes);
  });
});
