import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_09 - Character Limit', async ({ page }) => {
  const login = new LoginPage(page);

  await login.navigate();

  await login.username.fill('a'.repeat(200));

  const value = await login.username.inputValue();

  expect(value.length).toBeLessThanOrEqual(200);
});