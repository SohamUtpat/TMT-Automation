import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_189 - Verify Edit Form And Update User', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.createMobileUser(user);

  await test.step('Open edit form for created user', async () => {
    await mobileUsersPage.searchUsers(user.userName);
    await mobileUsersPage.openEditUser(user.userName);
    await mobileUsersPage.expectEditFormLoaded();
    await expect(mobileUsersPage.page.locator('#status')).toBeVisible();
  });

  await test.step('Update last name and save', async () => {
    const newLast = TestDataGenerator.generateRandomLastName();
    await mobileUsersPage.fillCreateUserForm({ lastName: newLast });
    await mobileUsersPage.submitUpdateUser();
    await mobileUsersPage.expectUserSavedSuccess();
  });
});
