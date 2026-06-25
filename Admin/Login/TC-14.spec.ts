import { test, expect } from '../fixtures/login.fixture';

test('TC_AP_14 - Verify Login Screen Components', async ({ loginPage }) => {
  await expect(loginPage.username).toBeVisible();
  await expect(loginPage.password).toBeVisible();
  await expect(loginPage.loginBtn).toBeVisible();
  await expect(loginPage.page.getByText('Forgot password?')).toBeVisible();
  await expect(loginPage.page.getByText('For help document')).toBeVisible();
});
