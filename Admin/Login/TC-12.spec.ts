import { test, expect } from '../fixtures/login.fixture';
import { loginData } from '../data/loginData';

test('TC_AP_12 - Password Eye Icon', async ({ loginPage }) => {
  await loginPage.password.fill(loginData.validPassword);
  await loginPage.passwordEyeIcon.first().click();
  await expect(loginPage.password).toHaveAttribute('type', 'text');
});
