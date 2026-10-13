import { test, expect } from '../fixtures/change-password.fixture';
import { ChangePasswordData } from '../data/ChangePasswordData';

test('TC_AP_51 - Verify Change Password Accessible From Every Page', async ({ changePasswordPage }) => {
  for (const pageInfo of ChangePasswordData.pages) {
    await changePasswordPage.expectAccessibleFromPage(pageInfo.path, pageInfo.title);
  }
});

test('TC_AP_52 - Verify Navigate To Change Password From Profile Menu', async ({ changePasswordPage }) => {
  await changePasswordPage.page.goto('/dashboard', { waitUntil: 'commit', timeout: 120_000 });
  await changePasswordPage.openFromProfileMenu();
  await changePasswordPage.expectChangePasswordPageLoaded();
});

test('TC_AP_53 - Verify Old Password Field Is Present', async ({ changePasswordPage }) => {
  await changePasswordPage.navigateToChangePassword();
  await expect(changePasswordPage.oldPasswordInput()).toBeVisible();
  await expect(changePasswordPage.oldPasswordInput()).toHaveAttribute('type', 'password');
});

test('TC_AP_54 - Verify Blank Old Password Shows Validation', async ({ changePasswordPage }) => {
  await changePasswordPage.navigateToChangePassword();
  await changePasswordPage.submitOldPasswordStep();
  await changePasswordPage.expectValidationMessage(ChangePasswordData.validation.enterValidPassword);
});

test('TC_AP_55 - Verify Password Changed With Valid Old And New Passwords', async ({
  changePasswordPage,
  testUser,
}) => {
  const newPassword = ChangePasswordData.buildAlternatePassword(testUser.password);
  await changePasswordPage.navigateToChangePassword();
  await changePasswordPage.changePasswordAndExpectLogout(testUser.password, newPassword);
  if (changePasswordPage.wasPasswordChangedOnServer()) {
    testUser.password = newPassword;
  }
});

test('TC_AP_56 - Verify Incorrect Old Password Shows Error', async ({ changePasswordPage, testUser }) => {
  await changePasswordPage.navigateToChangePassword();
  await changePasswordPage.advanceToNewPasswordStep('Wrong@12345');
  const newPassword = ChangePasswordData.buildAlternatePassword(testUser.password);
  await changePasswordPage.fillNewPasswordFields(newPassword, newPassword);
  await changePasswordPage.submitNewPasswordStep();
  await changePasswordPage.expectValidationMessage(ChangePasswordData.validation.incorrectOldPassword);
});

test('TC_AP_57 - Verify New Password Fields Appear After Valid Old Password', async ({
  changePasswordPage,
  testUser,
}) => {
  await changePasswordPage.navigateToChangePassword();
  await changePasswordPage.advanceToNewPasswordStep(testUser.password);
  await expect(changePasswordPage.newPasswordInput()).toBeVisible();
  await expect(changePasswordPage.confirmPasswordInput()).toBeVisible();
});

test('TC_AP_58 - Verify Password Policy Validation Message', async ({ changePasswordPage, testUser }) => {
  await changePasswordPage.navigateToChangePassword();
  await changePasswordPage.advanceToNewPasswordStep(testUser.password);
  await changePasswordPage.fillNewPasswordFields('weak', 'weak');
  await changePasswordPage.submitNewPasswordStep();
  await changePasswordPage.expectValidationMessage(ChangePasswordData.validation.passwordPolicy);
});

test('TC_AP_59 - Verify Confirm New Password Button Is Present', async ({ changePasswordPage, testUser }) => {
  await changePasswordPage.navigateToChangePassword();
  await changePasswordPage.advanceToNewPasswordStep(testUser.password);
  await expect(changePasswordPage.confirmNewPasswordButton()).toBeVisible();
});

test('TC_AP_60 - Verify Buttons Show Pointer Cursor On Hover', async ({ changePasswordPage, testUser }) => {
  await changePasswordPage.navigateToChangePassword();
  await changePasswordPage.expectButtonPointerCursor(changePasswordPage.changePasswordButton());
  await changePasswordPage.advanceToNewPasswordStep(testUser.password);
  await changePasswordPage.expectButtonPointerCursor(changePasswordPage.confirmNewPasswordButton());
});

test('TC_AP_61 - Verify New Password Policy Validation', async ({ changePasswordPage, testUser }) => {
  await changePasswordPage.navigateToChangePassword();
  await changePasswordPage.advanceToNewPasswordStep(testUser.password);
  await changePasswordPage.fillNewPasswordFields('short', 'short');
  await changePasswordPage.submitNewPasswordStep();
  await changePasswordPage.expectValidationMessage(ChangePasswordData.validation.passwordPolicy);
});

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
