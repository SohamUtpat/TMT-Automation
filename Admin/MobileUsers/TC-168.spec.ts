import { test, expect } from '../fixtures/mobile-users.fixture';

test('TC_AP_168 - Verify Default Language From Settings', async ({ mobileUsersPage }) => {
  await mobileUsersPage.clickCreateUser();
  const checked = mobileUsersPage.page.locator(
    '.languagePreference input[type="radio"]:checked, .languageClass input[type="radio"]:checked',
  );
  await expect(checked.first()).toBeVisible();
  await mobileUsersPage.cancelButton().click();
});
