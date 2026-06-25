import { test, expect } from '../fixtures/login.fixture';

test('TC_AP_13 - Pointer Cursor', async ({ loginPage }) => {
  await expect(loginPage.loginBtn).toHaveCSS('cursor', 'pointer');
});
