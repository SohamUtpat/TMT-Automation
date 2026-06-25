import { test, expect } from '../fixtures/login.fixture';
import { loginData } from '../data/loginData';

test('TC_AP_04 - Valid Long Username', async ({ loginPage }) => {
  await loginPage.login(loginData.validUser, loginData.validPassword);
  await loginPage.expectLoggedIn();
});
