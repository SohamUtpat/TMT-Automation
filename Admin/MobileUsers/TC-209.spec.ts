import { test, expect } from '../fixtures/mobile-users.fixture';

test('TC_AP_209 - Verify Bulk Upload And Create Buttons', async ({ mobileUsersPage }) => {
  await test.step('Verify Bulk Upload and Create User links are visible', async () => {
    await expect(mobileUsersPage.bulkUploadLink()).toBeVisible();
    await expect(mobileUsersPage.createUserLink()).toBeVisible();
  });

  await test.step('Navigate to bulk upload page', async () => {
    await mobileUsersPage.bulkUploadLink().click();
    await expect(mobileUsersPage.page).toHaveURL(/bulk-upload/);
  });
});
