import { test, expect } from '../fixtures/login.fixture';

test('TC_AP_10 - Verify Placeholders', async ({ loginPage }) => {
  await expect(loginPage.username).toHaveAttribute('placeholder', 'Enter Here');
  await expect(loginPage.password).toHaveAttribute('placeholder', '**********');
});
