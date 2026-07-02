import { test, expect } from '../fixtures/change-password.fixture';
import { ChangePasswordData } from '../data/ChangePasswordData';

test('TC_AP_54 - Verify Blank Old Password Shows Validation', async ({ changePasswordPage }) => {
  await changePasswordPage.navigateToChangePassword();
  await changePasswordPage.submitOldPasswordStep();
  await changePasswordPage.expectValidationMessage(ChangePasswordData.validation.enterValidPassword);
});
