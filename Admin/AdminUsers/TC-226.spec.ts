import { test, expect } from '../fixtures/admin-users.fixture';
import { AdminUsersData } from '../data/AdminUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_226 - Verify Default Language From Settings', async ({ adminUsersPage }) => {
  await adminUsersPage.clickCreateUser();
  const checked = adminUsersPage.page.locator(
    '.languagePreference input[type="radio"]:checked, .languageClass input[type="radio"]:checked',
  );
  await expect(checked).toBeVisible();
  const label = await checked.locator('xpath=ancestor::label').textContent();
  expect(label?.trim().length).toBeGreaterThan(0);
  await adminUsersPage.cancelForm();
});
