import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_10 - Verify Placeholders', async ({ page }) => {
  const login = new LoginPage(page);

  await login.navigate();

  await expect(login.username).toHaveAttribute('placeholder', 'Enter Here');
  await expect(login.password).toHaveAttribute('placeholder', '**********');
});
