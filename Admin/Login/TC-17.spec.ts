import { test } from '../fixtures/login.fixture';

test('TC_AP_17 - Empty Username Password', async ({ loginPage }) => {
  await loginPage.submitLoginForm('', '');
  await loginPage.expectEmptyFieldValidationErrors();
});
