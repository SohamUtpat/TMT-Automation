import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_158 - Verify Text Fields Trim Spaces', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser();
  const spacedFirst = `${user.firstName}  `;

  await mobileUsersPage.clickCreateUser();
  await mobileUsersPage.fillCreateUserForm({
    ...user,
    firstName: spacedFirst,
    lastName: `${user.lastName}  `,
    userName: `${user.userName}  `,
  });
  await mobileUsersPage.submitCreateUser();
  await mobileUsersPage.expectUserSavedSuccess();

  await mobileUsersPage.searchUsers(user.userName);
  await mobileUsersPage.expectUserVisible(user.userName);
});
