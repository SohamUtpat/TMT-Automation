import fs from 'fs';
import path from 'path';

const outDir = path.resolve('Admin/ChangePassword');
fs.mkdirSync(outDir, { recursive: true });

const header = `import { test, expect } from '../fixtures/change-password.fixture';
import { ChangePasswordData } from '../data/ChangePasswordData';
`;

const specs = {
  51: `test('TC_AP_51 - Verify Change Password Accessible From Every Page', async ({ changePasswordPage }) => {
  for (const pageInfo of ChangePasswordData.pages) {
    await changePasswordPage.expectAccessibleFromPage(pageInfo.path, pageInfo.title);
  }
});`,

  52: `test('TC_AP_52 - Verify Navigate To Change Password From Profile Menu', async ({ changePasswordPage }) => {
  await changePasswordPage.page.goto('/dashboard', { waitUntil: 'commit', timeout: 120_000 });
  await changePasswordPage.openFromProfileMenu();
  await changePasswordPage.expectChangePasswordPageLoaded();
});`,

  53: `test('TC_AP_53 - Verify Old Password Field Is Present', async ({ changePasswordPage }) => {
  await changePasswordPage.navigateToChangePassword();
  await expect(changePasswordPage.oldPasswordInput()).toBeVisible();
  await expect(changePasswordPage.oldPasswordInput()).toHaveAttribute('type', 'password');
});`,

  54: `test('TC_AP_54 - Verify Blank Old Password Shows Validation', async ({ changePasswordPage }) => {
  await changePasswordPage.navigateToChangePassword();
  await changePasswordPage.submitOldPasswordStep();
  await changePasswordPage.expectValidationMessage(ChangePasswordData.validation.enterValidPassword);
});`,

  55: `test('TC_AP_55 - Verify Password Changed With Valid Old And New Passwords', async ({
  changePasswordPage,
  testUser,
}) => {
  const newPassword = ChangePasswordData.buildAlternatePassword(testUser.password);
  await changePasswordPage.navigateToChangePassword();
  await changePasswordPage.changePasswordComplete(testUser.password, newPassword);
  testUser.password = newPassword;
});`,

  56: `test('TC_AP_56 - Verify Incorrect Old Password Shows Error', async ({ changePasswordPage, testUser }) => {
  await changePasswordPage.navigateToChangePassword();
  await changePasswordPage.advanceToNewPasswordStep('Wrong@12345');
  const newPassword = ChangePasswordData.buildAlternatePassword(testUser.password);
  await changePasswordPage.fillNewPasswordFields(newPassword, newPassword);
  await changePasswordPage.submitNewPasswordStep();
  await changePasswordPage.expectValidationMessage(ChangePasswordData.validation.incorrectOldPassword);
});`,

  57: `test('TC_AP_57 - Verify New Password Fields Appear After Valid Old Password', async ({
  changePasswordPage,
  testUser,
  }) => {
  await changePasswordPage.navigateToChangePassword();
  await changePasswordPage.advanceToNewPasswordStep(testUser.password);
  await expect(changePasswordPage.newPasswordInput()).toBeVisible();
  await expect(changePasswordPage.confirmPasswordInput()).toBeVisible();
});`,

  58: `test('TC_AP_58 - Verify Password Policy Validation Message', async ({ changePasswordPage, testUser }) => {
  await changePasswordPage.navigateToChangePassword();
  await changePasswordPage.advanceToNewPasswordStep(testUser.password);
  await changePasswordPage.fillNewPasswordFields('weak', 'weak');
  await changePasswordPage.submitNewPasswordStep();
  await changePasswordPage.expectValidationMessage(ChangePasswordData.validation.passwordPolicy);
});`,

  59: `test('TC_AP_59 - Verify Confirm New Password Button Is Present', async ({ changePasswordPage, testUser }) => {
  await changePasswordPage.navigateToChangePassword();
  await changePasswordPage.advanceToNewPasswordStep(testUser.password);
  await expect(changePasswordPage.confirmNewPasswordButton()).toBeVisible();
});`,

  60: `test('TC_AP_60 - Verify Buttons Show Pointer Cursor On Hover', async ({ changePasswordPage, testUser }) => {
  await changePasswordPage.navigateToChangePassword();
  await changePasswordPage.expectButtonPointerCursor(changePasswordPage.changePasswordButton());
  await changePasswordPage.advanceToNewPasswordStep(testUser.password);
  await changePasswordPage.expectButtonPointerCursor(changePasswordPage.confirmNewPasswordButton());
});`,

  61: `test('TC_AP_61 - Verify New Password Policy Validation', async ({ changePasswordPage, testUser }) => {
  await changePasswordPage.navigateToChangePassword();
  await changePasswordPage.advanceToNewPasswordStep(testUser.password);
  await changePasswordPage.fillNewPasswordFields('short', 'short');
  await changePasswordPage.submitNewPasswordStep();
  await changePasswordPage.expectValidationMessage(ChangePasswordData.validation.passwordPolicy);
});`,

  62: `test('TC_AP_62 - Verify New And Confirm Password Mismatch Validation', async ({
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
});`,

  63: `test('TC_AP_63 - Verify New Password Same As Old Password Validation', async ({
  changePasswordPage,
  testUser,
  }) => {
  await changePasswordPage.navigateToChangePassword();
  await changePasswordPage.advanceToNewPasswordStep(testUser.password);
  await changePasswordPage.fillNewPasswordFields(testUser.password, testUser.password);
  await changePasswordPage.submitNewPasswordStep();
  await changePasswordPage.expectValidationMessage(ChangePasswordData.validation.sameAsOldPassword);
});`,
};

const ids = Object.keys(specs)
  .map(Number)
  .sort((a, b) => a - b);

for (const id of ids) {
  const file = path.join(outDir, `TC-${id}.spec.ts`);
  fs.writeFileSync(file, `${header}\n${specs[id]}\n`);
  console.log(`Wrote ${file}`);
}

console.log(`Generated ${ids.length} change password spec files.`);
