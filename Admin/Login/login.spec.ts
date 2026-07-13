import { test, expect } from '../fixtures/login.fixture';
import { loginData } from '../data/loginData';

test('TC_AP_02 - Incorrect Username', async ({ loginPage }) => {
  await loginPage.login('Soham06', loginData.validPassword);
  await loginPage.expectInvalidCredentials();
});

test('TC_AP_03 - Username Case Sensitivity', async ({ loginPage }) => {
  await loginPage.login('SOHAM05', loginData.validPassword);
  await loginPage.expectInvalidCredentials();
});

test('TC_AP_04 - Valid Long Username', async ({ loginPage }) => {
  await loginPage.login(loginData.validUser, loginData.validPassword);
  await loginPage.expectLoggedIn();
});

test('TC_AP_05 - Invalid Username Not Present', async ({ loginPage }) => {
  await loginPage.login(loginData.userNotPresent, loginData.validPassword);
  await loginPage.expectInvalidCredentials();
});

test('TC_AP_06 - Incorrect Long Password', async ({ loginPage }) => {
  await loginPage.login(loginData.validUser, 'VeryLongWrongPassword123456789');
  await loginPage.expectInvalidCredentials();
});

test('TC_AP_07 - Excess Length Password', async ({ loginPage }) => {
  await loginPage.login(loginData.validUser, `${loginData.validPassword}123123123123123123123123123123`);
  await loginPage.expectInvalidCredentials();
});

test('TC_AP_08 - Invalid Username and Password', async ({ loginPage }) => {
  await loginPage.login(loginData.invalidUser, loginData.invalidPassword);
  await loginPage.expectInvalidCredentials();
});

// test('TC_AP_09 - Character Limit', async ({ loginPage }) => {
//   await loginPage.username.fill('a'.repeat(200));
//   const value = await loginPage.username.inputValue();
//   expect(value.length).toBeLessThanOrEqual(200);
// });

test('TC_AP_10 - Verify Placeholders', async ({ loginPage }) => {
  await expect(loginPage.username).toHaveAttribute('placeholder', 'Enter Here');
  await expect(loginPage.password).toHaveAttribute('placeholder', '**********');
});

test('TC_AP_11 - Verify Labels', async ({ page }) => {
  await expect(page.getByText('Username *', { exact: true })).toBeVisible();
  await expect(page.getByText('Password *', { exact: true })).toBeVisible();
});

test('TC_AP_12 - Password Eye Icon', async ({ loginPage }) => {
  await loginPage.password.fill(loginData.validPassword);
  await loginPage.passwordEyeIcon.first().click();
  await expect(loginPage.password).toHaveAttribute('type', 'text');
});

test('TC_AP_13 - Pointer Cursor', async ({ loginPage }) => {
  await expect(loginPage.loginBtn).toHaveCSS('cursor', 'pointer');
});

test('TC_AP_14 - Verify Login Screen Components', async ({ loginPage }) => {
  await expect(loginPage.username).toBeVisible();
  await expect(loginPage.password).toBeVisible();
  await expect(loginPage.loginBtn).toBeVisible();
  await expect(loginPage.page.getByText('Forgot password?')).toBeVisible();
  await expect(loginPage.page.getByText('For help document')).toBeVisible();
});

test('TC_AP_15 - Admin User Login', async ({ loginPage }) => {
  await loginPage.login(loginData.validUser, loginData.validPassword);
  await loginPage.expectLoggedIn();
});

test('TC_AP_16 - Mobile User Cannot Login', async ({ loginPage }) => {
  await loginPage.login(loginData.mobileUser, loginData.mobilePassword);
  await loginPage.expectInvalidCredentials();
});

test('TC_AP_17 - Empty Username Password', async ({ loginPage }) => {
  await loginPage.submitLoginForm('', '');
  await loginPage.expectEmptyFieldValidationErrors();
});
