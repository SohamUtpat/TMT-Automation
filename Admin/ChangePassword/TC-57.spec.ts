import { test, expect } from '../fixtures/change-password.fixture';
import { ChangePasswordData } from '../data/ChangePasswordData';

test('TC_AP_57 - Verify New Password Fields Appear After Valid Old Password', async ({
  changePasswordPage,
  testUser,
  }) => {
  await changePasswordPage.navigateToChangePassword();
  await changePasswordPage.advanceToNewPasswordStep(testUser.password);
  await expect(changePasswordPage.newPasswordInput()).toBeVisible();
  await expect(changePasswordPage.confirmPasswordInput()).toBeVisible();
});
