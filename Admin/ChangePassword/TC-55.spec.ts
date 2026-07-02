import { test, expect } from '../fixtures/change-password.fixture';
import { ChangePasswordData } from '../data/ChangePasswordData';

test('TC_AP_55 - Verify Password Changed With Valid Old And New Passwords', async ({
  changePasswordPage,
  testUser,
}) => {
  const newPassword = ChangePasswordData.buildAlternatePassword(testUser.password);
  await changePasswordPage.navigateToChangePassword();
  await changePasswordPage.changePasswordComplete(testUser.password, newPassword);
  testUser.password = newPassword;
});
