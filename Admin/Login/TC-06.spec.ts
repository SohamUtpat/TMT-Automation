import { test, expect } from '../fixtures/login.fixture';
import { loginData } from '../data/loginData';

test('TC_AP_06 - Incorrect Long Password', async ({ loginPage }) => {
  await loginPage.login(loginData.validUser, 'VeryLongWrongPassword123456789');
  await loginPage.expectInvalidCredentials();
});
