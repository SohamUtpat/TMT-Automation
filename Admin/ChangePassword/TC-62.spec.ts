import { test, expect } from '../fixtures/change-password.fixture';
import { ChangePasswordData } from '../data/ChangePasswordData';

test('TC_AP_62 - Verify New And Confirm Password Mismatch Validation', async ({
  changePasswordPage,
  testUser,
  }) => {
  await changePasswordPage.navigateToChangePassword();
  await changePasswordPage.advanceToNewPasswordStep(testUser.password);
  const newPassword = ChangePasswordData.buildAlternatePassword(testUser.password);
  const otherPassword = ChangePasswordData.buildAlternatePassword(newPassword);
  await changePasswordPage.fillNewPasswordFields(newPassword, otherPassword);
  await changePasswordPage.submitNewPasswordStep();
  await changePasswordPage.expectValidationMessage(ChangePasswordData.validation.passwordsDoNotMatch);
});
