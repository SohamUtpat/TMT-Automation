import { test, expect } from '../fixtures/login.fixture';
import { loginData } from '../data/loginData';

test('TC_AP_15 - Admin User Login', async ({ loginPage }) => {
  await loginPage.login(loginData.validUser, loginData.validPassword);
  await loginPage.expectLoggedIn();
});
