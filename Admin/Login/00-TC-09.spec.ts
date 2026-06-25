import { test, expect } from '../fixtures/login.fixture';

test('TC_AP_09 - Character Limit', async ({ loginPage }) => {
  await loginPage.username.fill('a'.repeat(200));

  const value = await loginPage.username.inputValue();

  expect(value.length).toBeLessThanOrEqual(200);
});
