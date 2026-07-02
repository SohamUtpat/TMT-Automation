import { test, expect } from '../fixtures/change-password.fixture';
import { ChangePasswordData } from '../data/ChangePasswordData';

test('TC_AP_63 - Verify New Password Same As Old Password Validation', async ({
  changePasswordPage,
  testUser,
  }) => {
  await changePasswordPage.navigateToChangePassword();
  await changePasswordPage.advanceToNewPasswordStep(testUser.password);
  await changePasswordPage.fillNewPasswordFields(testUser.password, testUser.password);
  await changePasswordPage.submitNewPasswordStep();
  await changePasswordPage.expectValidationMessage(ChangePasswordData.validation.sameAsOldPassword);
});
