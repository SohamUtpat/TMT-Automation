import { test, expect } from '../fixtures/login.fixture';
import { loginData } from '../data/loginData';

test('TC_AP_17 - Empty Username Password', async ({ loginPage, page }) => {
  await loginPage.login('', '');

  await expect(page.getByText(loginData.usernameRequiredMessage)).toBeVisible();
  await expect(page.getByText(loginData.passwordRequiredMessage)).toBeVisible();
});
