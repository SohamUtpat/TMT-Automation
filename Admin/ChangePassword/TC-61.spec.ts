import { test, expect } from '../fixtures/change-password.fixture';
import { ChangePasswordData } from '../data/ChangePasswordData';

test('TC_AP_61 - Verify New Password Policy Validation', async ({ changePasswordPage, testUser }) => {
  await changePasswordPage.navigateToChangePassword();
  await changePasswordPage.advanceToNewPasswordStep(testUser.password);
  await changePasswordPage.fillNewPasswordFields('short', 'short');
  await changePasswordPage.submitNewPasswordStep();
  await changePasswordPage.expectValidationMessage(ChangePasswordData.validation.passwordPolicy);
});
