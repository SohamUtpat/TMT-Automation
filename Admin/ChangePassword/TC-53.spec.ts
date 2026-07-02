import { test, expect } from '../fixtures/change-password.fixture';
import { ChangePasswordData } from '../data/ChangePasswordData';

test('TC_AP_53 - Verify Old Password Field Is Present', async ({ changePasswordPage }) => {
  await changePasswordPage.navigateToChangePassword();
  await expect(changePasswordPage.oldPasswordInput()).toBeVisible();
  await expect(changePasswordPage.oldPasswordInput()).toHaveAttribute('type', 'password');
});
