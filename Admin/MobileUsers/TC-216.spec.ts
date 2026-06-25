import { test } from '../fixtures/mobile-users.fixture';

test('TC_AP_216 - Verify Password Field On Create Form', async ({ mobileUsersPage }) => {
  await test.step('Open create form and verify password field is visible', async () => {
    await mobileUsersPage.clickCreateUser();
    await mobileUsersPage.expectPasswordFieldVisible(true);
  });
});
