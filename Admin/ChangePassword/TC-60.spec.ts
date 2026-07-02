import { test, expect } from '../fixtures/change-password.fixture';
import { ChangePasswordData } from '../data/ChangePasswordData';

test('TC_AP_60 - Verify Buttons Show Pointer Cursor On Hover', async ({ changePasswordPage, testUser }) => {
  await changePasswordPage.navigateToChangePassword();
  await changePasswordPage.expectButtonPointerCursor(changePasswordPage.changePasswordButton());
  await changePasswordPage.advanceToNewPasswordStep(testUser.password);
  await changePasswordPage.expectButtonPointerCursor(changePasswordPage.confirmNewPasswordButton());
});
