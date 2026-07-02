import { test, expect } from '../fixtures/change-password.fixture';
import { ChangePasswordData } from '../data/ChangePasswordData';

test('TC_AP_56 - Verify Incorrect Old Password Shows Error', async ({ changePasswordPage, testUser }) => {
  await changePasswordPage.navigateToChangePassword();
  await changePasswordPage.advanceToNewPasswordStep('Wrong@12345');
  const newPassword = ChangePasswordData.buildAlternatePassword(testUser.password);
  await changePasswordPage.fillNewPasswordFields(newPassword, newPassword);
  await changePasswordPage.submitNewPasswordStep();
  await changePasswordPage.expectValidationMessage(ChangePasswordData.validation.incorrectOldPassword);
});
