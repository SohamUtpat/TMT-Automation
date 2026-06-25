import { test, expect } from '../fixtures/login.fixture';

test('TC_AP_11 - Verify Labels', async ({ page }) => {
  await expect(page.getByText('Username *', { exact: true })).toBeVisible();
  await expect(page.getByText('Password *', { exact: true })).toBeVisible();
});
