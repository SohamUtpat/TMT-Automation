import fs from 'fs';
import path from 'path';

const outDir = path.resolve('Admin/AdminUsers');
fs.mkdirSync(outDir, { recursive: true });

const header = `import { test, expect } from '../fixtures/admin-users.fixture';
import { AdminUsersData } from '../data/AdminUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';
`;

const specs = {
  222: `test.describe('TC_AP_222 - Create Admin User Form Fields', () => {
  test('Verify create admin user form has required fields', async ({ adminUsersPage }) => {
    await adminUsersPage.clickCreateUser();

    await expect(adminUsersPage.profileImage()).toBeVisible();
    await expect(adminUsersPage.profileUploadInput()).toBeAttached();
    await expect(adminUsersPage.userNameInput()).toBeVisible();
    await expect(adminUsersPage.firstNameInput()).toBeVisible();
    await expect(adminUsersPage.lastNameInput()).toBeVisible();
    await expect(adminUsersPage.emailInput()).toBeVisible();
    await expect(adminUsersPage.phoneInput()).toBeVisible();
    await adminUsersPage.expectFormFieldVisible(/Language/i);

    const dorakuVisible = await adminUsersPage.page
      .locator('.admin-radio-lables, .admin-radio-labels')
      .filter({ hasText: /Doraku/i })
      .isVisible()
      .catch(() => false);
    if (dorakuVisible) {
      await adminUsersPage.expectFormFieldVisible(/Doraku/i);
    }

    await adminUsersPage.cancelButton().click();
    await adminUsersPage.expectListingLoaded();
  });
});`,

  223: `test('TC_AP_223 - Verify Text Fields Trim Spaces', async ({ adminUsersPage }) => {
  const user = AdminUsersData.buildValidUser();

  await adminUsersPage.clickCreateUser();
  await adminUsersPage.fillCreateUserForm({
    ...user,
    firstName: \`  \${user.firstName}  \`,
    lastName: \`  \${user.lastName}  \`,
    userName: \`  \${user.userName}  \`,
    email: \`  \${user.email}  \`,
  });
  await adminUsersPage.submitCreateUser();

  await adminUsersPage.searchUsers(user.userName);
  await adminUsersPage.expectUserVisible(user.userName);
});`,

  224: `test('TC_AP_224 - Verify Required Fields Except Mobile And Profile Pic', async ({ adminUsersPage }) => {
  const user = AdminUsersData.buildValidUser({ phone: '' });

  await adminUsersPage.clickCreateUser();
  await adminUsersPage.fillCreateUserForm(user);
  await adminUsersPage.submitCreateUser();
  await adminUsersPage.searchUsers(user.userName);
  await adminUsersPage.expectUserVisible(user.userName);

  await adminUsersPage.clickCreateUser();
  await adminUsersPage.fillCreateUserForm({
    firstName: '',
    lastName: '',
    userName: '',
    email: '',
  });
  await adminUsersPage.submitCreateUser({ waitForApi: false });
  await adminUsersPage.expectValidationMessage(AdminUsersData.validation.required);
  await expect(adminUsersPage.firstNameInput()).toBeVisible();
});`,

  225: `test('TC_AP_225 - Verify Create And Cancel Buttons', async ({ adminUsersPage }) => {
  await adminUsersPage.clickCreateUser();
  await expect(adminUsersPage.submitButton()).toBeVisible();
  await expect(adminUsersPage.cancelButton()).toBeVisible();
  await adminUsersPage.cancelForm();
});`,

  226: `test('TC_AP_226 - Verify Default Language From Settings', async ({ adminUsersPage }) => {
  await adminUsersPage.clickCreateUser();
  const checked = adminUsersPage.page.locator(
    '.languagePreference input[type="radio"]:checked, .languageClass input[type="radio"]:checked',
  );
  await expect(checked).toBeVisible();
  const label = await checked.locator('xpath=ancestor::label').textContent();
  expect(label?.trim().length).toBeGreaterThan(0);
  await adminUsersPage.cancelForm();
});`,

  227: `// import { test } from '../fixtures/admin-users.fixture';
//
// test.skip('TC_AP_227 - Admin User Cannot Login To Mobile App', async () => {
//   // Requires mobile application login — out of admin portal automation scope.
// });`,

  228: `test('TC_AP_228 - Verify Created User Appears In Listing', async ({ adminUsersPage }) => {
  const user = AdminUsersData.buildValidUser();
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.searchUsers(user.userName);
  await adminUsersPage.expectUserVisible(user.userName);

  const apiUser = (await adminUsersPage.fetchAdminUsers({ search: user.userName })).users[0];
  expect(apiUser?.userName).toBe(user.userName);
});`,

  229: `// import { test } from '../fixtures/admin-users.fixture';
//
// test.skip('TC_AP_229 - Verify Created User Receives Email', async () => {
//   // Email delivery cannot be verified from admin portal automation.
// });`,

  230: `test('TC_AP_230 - Verify Default Status Active On Create', async ({ adminUsersPage }) => {
  const user = AdminUsersData.buildValidUser();
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.searchUsers(user.userName);

  const statuses = await adminUsersPage.getColumnValues('status');
  expect(statuses[0]).toBe(AdminUsersData.status.active);

  const apiUser = (await adminUsersPage.fetchAdminUsers({ search: user.userName })).users[0];
  expect(apiUser?.status).toBe('1');
});`,

  231: `test('TC_AP_231 - Verify Inactive User Status On Listing', async ({ adminUsersPage }) => {
  const user = AdminUsersData.buildValidUser();
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.openEditUser(user.userName!);
  await adminUsersPage.selectStatus(false);
  await adminUsersPage.submitUpdateUser();
  await adminUsersPage.expectListingLoaded();

  await adminUsersPage.searchUsers(user.userName!);
  const statuses = await adminUsersPage.getColumnValues('status');
  expect(statuses[0]).toBe(AdminUsersData.status.inactive);
});`,

  232: `test('TC_AP_232 - Verify User Cannot Make Themselves Inactive', async ({ adminUsersPage }) => {
  const loggedIn = await adminUsersPage.getLoggedInAdmin();
  await adminUsersPage.openEditUser(loggedIn.userName);
  await expect(adminUsersPage.statusRadioGroup()).toHaveCount(0);
  await adminUsersPage.cancelForm();
});`,

  233: `// import { test } from '../fixtures/admin-users.fixture';
//
// test.skip('TC_AP_233 - Superadmin Reactivates All Inactive Admins', async () => {
//   // Requires superadmin role and controlled environment — out of scope.
// });`,

  234: `test('TC_AP_234 - Verify Edit Form Matches Create Form Fields', async ({ adminUsersPage }) => {
  const apiUser = await adminUsersPage.getApiListingUser();
  await adminUsersPage.openEditUser(apiUser.userName);

  await expect(adminUsersPage.firstNameInput()).toBeVisible();
  await expect(adminUsersPage.lastNameInput()).toBeVisible();
  await expect(adminUsersPage.userNameInput()).toBeDisabled();
  await expect(adminUsersPage.emailInput()).toBeVisible();
  await expect(adminUsersPage.phoneInput()).toBeVisible();
  await adminUsersPage.expectFormFieldVisible(/Language/i);
  await expect(adminUsersPage.submitButton()).toBeVisible();
  await expect(adminUsersPage.cancelButton()).toBeVisible();
  await adminUsersPage.cancelForm();
});`,

  235: `test('TC_AP_235 - Verify Status Can Be Changed On Edit', async ({ adminUsersPage }) => {
  const user = AdminUsersData.buildValidUser();
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.openEditUser(user.userName!);
  await expect(adminUsersPage.statusRadioGroup()).toBeVisible();
  await adminUsersPage.selectStatus(false);
  await adminUsersPage.submitUpdateUser();
  await adminUsersPage.expectUserSavedSuccess();
});`,

  236: `test('TC_AP_236 - Verify Inactive Status After Edit', async ({ adminUsersPage }) => {
  const user = AdminUsersData.buildValidUser();
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.openEditUser(user.userName!);
  await adminUsersPage.selectStatus(false);
  await adminUsersPage.submitUpdateUser();
  await adminUsersPage.searchUsers(user.userName!);
  const statuses = await adminUsersPage.getColumnValues('status');
  expect(statuses[0]).toBe(AdminUsersData.status.inactive);
});`,

  237: `test('TC_AP_237 - Verify Edit Form Has Update And Cancel Buttons', async ({ adminUsersPage }) => {
  const apiUser = await adminUsersPage.getApiListingUser();
  await adminUsersPage.openEditUser(apiUser.userName);
  await expect(adminUsersPage.submitButton()).toBeVisible();
  await expect(adminUsersPage.cancelButton()).toBeVisible();
  await adminUsersPage.cancelForm();
});`,

  238: `test('TC_AP_238 - Verify User Details Can Be Edited And Updated', async ({ adminUsersPage }) => {
  const user = AdminUsersData.buildValidUser();
  await adminUsersPage.createAdminUser(user);

  const updatedFirst = TestDataGenerator.generateRandomName();
  await adminUsersPage.openEditUser(user.userName!);
  await adminUsersPage.fillCreateUserForm({ firstName: updatedFirst });
  await adminUsersPage.submitUpdateUser();
  await adminUsersPage.expectUserSavedSuccess();

  await adminUsersPage.searchUsers(user.userName!);
  const names = await adminUsersPage.getColumnValues('name');
  expect(names[0]).toContain(updatedFirst);
});`,

  239: `test('TC_AP_239 - Verify User Saved Successfully Message On Update', async ({ adminUsersPage }) => {
  const apiUser = await adminUsersPage.getApiListingUser();
  await adminUsersPage.openEditUser(apiUser.userName);
  await adminUsersPage.fillCreateUserForm({
    firstName: TestDataGenerator.generateRandomName(),
  });
  await adminUsersPage.submitUpdateUser();
  await expect(adminUsersPage.toast(AdminUsersData.messages.userSaved)).toBeVisible();
});`,

  240: `test('TC_AP_240 - Verify Update Without Mobile And Profile Pic', async ({ adminUsersPage }) => {
  const user = AdminUsersData.buildValidUser({ phone: '' });
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.openEditUser(user.userName!);
  await adminUsersPage.fillCreateUserForm({
    lastName: TestDataGenerator.generateRandomLastName(),
    phone: '',
  });
  await adminUsersPage.submitUpdateUser();
  await adminUsersPage.expectUserSavedSuccess();
});`,

  241: `test('TC_AP_241 - Verify Admin Listing Columns And Data', async ({ adminUsersPage }) => {
  for (const col of AdminUsersData.listingColumns) {
    await adminUsersPage.expectColumnHeaderVisible(col);
  }

  const apiUser = await adminUsersPage.getApiListingUser();
  await adminUsersPage.prepareUserFromApi(apiUser);

  const userNames = await adminUsersPage.getColumnValues('userName');
  expect(userNames).toContain(apiUser.userName);

  const emails = await adminUsersPage.getColumnValues('email');
  expect(emails.some((email) => email.includes(apiUser.email.split('@')[0]))).toBe(true);
});`,

  242: `// import { test } from '../fixtures/admin-users.fixture';
//
// test.skip('TC_AP_242 - Verify Doraku Failure Notification', async () => {
//   // Requires Doraku integration failure trigger — out of admin portal scope.
// });`,

  243: `test('TC_AP_243 - Verify Delete Opens Confirmation And Inactivates User', async ({ adminUsersPage }) => {
  const user = AdminUsersData.buildValidUser();
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.searchUsers(user.userName!);

  await adminUsersPage.clickDeleteIcon(user.userName!);
  await expect(adminUsersPage.confirmModal()).toContainText(/delete user/i);
  await adminUsersPage.confirmModalAction(true);
  await expect(adminUsersPage.toast(/inactivated|deleted/i)).toBeVisible({ timeout: 30_000 });

  await adminUsersPage.searchUsers(user.userName!);
  const statuses = await adminUsersPage.getColumnValues('status');
  expect(statuses[0]).toBe(AdminUsersData.status.inactive);
});`,

  244: `test('TC_AP_244 - Verify Status Visible On Listing After Update', async ({ adminUsersPage }) => {
  const user = AdminUsersData.buildValidUser();
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.searchUsers(user.userName!);
  let statuses = await adminUsersPage.getColumnValues('status');
  expect(statuses[0]).toBe(AdminUsersData.status.active);

  await adminUsersPage.openEditUser(user.userName!);
  await adminUsersPage.selectStatus(false);
  await adminUsersPage.submitUpdateUser();
  await adminUsersPage.searchUsers(user.userName!);
  statuses = await adminUsersPage.getColumnValues('status');
  expect(statuses[0]).toBe(AdminUsersData.status.inactive);
});`,

  245: `test('TC_AP_245 - Verify Edit Icon Opens Update Form', async ({ adminUsersPage }) => {
  const apiUser = await adminUsersPage.getApiListingUser();
  await adminUsersPage.openEditUser(apiUser.userName);
  await adminUsersPage.expectEditFormLoaded();
  await adminUsersPage.cancelForm();
});`,

  246: `test('TC_AP_246 - Verify Pagination Shows 25 Users Per Page', async ({ adminUsersPage }) => {
  const apiTotal = await adminUsersPage.getApiAdminUsersCount();
  const visibleRows = await adminUsersPage.getVisibleRowCount();
  expect(visibleRows).toBeLessThanOrEqual(AdminUsersData.pagination.defaultPageSize);
  if (apiTotal > AdminUsersData.pagination.defaultPageSize) {
    expect(visibleRows).toBe(AdminUsersData.pagination.defaultPageSize);
    await expect(adminUsersPage.nextPageButton()).toBeEnabled();
    await adminUsersPage.nextPageButton().click();
    await adminUsersPage.waitForListingRefresh();
    expect(await adminUsersPage.getVisibleRowCount()).toBeGreaterThan(0);
    await adminUsersPage.goToFirstPage();
  }
});`,

  247: `test('TC_AP_247 - Verify Search Trims Leading And Trailing Spaces', async ({ adminUsersPage }) => {
  const apiUser = await adminUsersPage.getApiListingUser();
  await adminUsersPage.searchUsers(\`  \${apiUser.userName}  \`);
  await adminUsersPage.expectUserVisible(apiUser.userName);
  const userNames = await adminUsersPage.getColumnValues('userName');
  expect(userNames.every((name) => name.includes(apiUser.userName) || name === apiUser.userName)).toBe(true);
});`,

  248: `test('TC_AP_248 - Verify Usernames Are Unique', async ({ adminUsersPage }) => {
  const user = AdminUsersData.buildValidUser();
  await adminUsersPage.createAdminUser(user);

  await adminUsersPage.clickCreateUser();
  await adminUsersPage.fillCreateUserForm({
    ...AdminUsersData.buildValidUser(),
    userName: user.userName,
  });
  await adminUsersPage.submitCreateUser({ waitForApi: false });
  await expect(adminUsersPage.page.locator('.ant-modal, .create-user-form-div, .admin-submit-button').first()).toBeVisible();
});`,

  250: `test('TC_AP_250 - Verify Profile Photo Format Validation', async ({ adminUsersPage }) => {
  await adminUsersPage.clickCreateUser();
  await adminUsersPage.uploadProfilePhoto(AdminUsersData.testAssets.invalidPdf);
  await adminUsersPage.expectUploadError(AdminUsersData.validation.invalidImageFormat);
  await adminUsersPage.cancelForm();
});`,

  251: `// import { test } from '../fixtures/admin-users.fixture';
//
// test.skip('TC251 - Verify Profile Photo After Admin Login', async () => {
//   // Requires separate login session with newly created admin — out of scope.
// });`,

  252: `test('TC_AP_252 - Verify First Name Maximum Length 50', async ({ adminUsersPage }) => {
  const user = AdminUsersData.buildValidUser({
    firstName: TestDataGenerator.generateLongString(50),
  });
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.searchUsers(user.userName!);
  await adminUsersPage.expectUserVisible(user.userName!);
});`,

  253: `test('TC_AP_253 - Verify First Name Over 50 Shows Validation', async ({ adminUsersPage }) => {
  await adminUsersPage.clickCreateUser();
  await adminUsersPage.fillCreateUserForm({
    ...AdminUsersData.buildValidUser(),
    firstName: TestDataGenerator.generateLongString(51),
  });
  await adminUsersPage.submitCreateUser({ waitForApi: false });
  await adminUsersPage.expectValidationMessage(AdminUsersData.validation.firstNameMaxLength);
});`,

  254: `test('TC_AP_254 - Verify Last Name Maximum Length 50', async ({ adminUsersPage }) => {
  const user = AdminUsersData.buildValidUser({
    lastName: TestDataGenerator.generateLongString(50),
  });
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.searchUsers(user.userName!);
  await adminUsersPage.expectUserVisible(user.userName!);
});`,

  255: `test('TC_AP_255 - Verify Last Name Over 50 Shows Validation', async ({ adminUsersPage }) => {
  await adminUsersPage.clickCreateUser();
  await adminUsersPage.fillCreateUserForm({
    ...AdminUsersData.buildValidUser(),
    lastName: TestDataGenerator.generateLongString(51),
  });
  await adminUsersPage.submitCreateUser({ waitForApi: false });
  await adminUsersPage.expectValidationMessage(AdminUsersData.validation.lastNameMaxLength);
});`,

  256: `test('TC_AP_256 - Verify No Minimum Length For Name Fields', async ({ adminUsersPage }) => {
  const user = AdminUsersData.buildValidUser({
    firstName: 'A',
    lastName: 'B',
  });
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.searchUsers(user.userName!);
  await adminUsersPage.expectUserVisible(user.userName!);
});`,

  257: `test('TC_AP_257 - Verify Username Maximum Length 50', async ({ adminUsersPage }) => {
  const user = AdminUsersData.buildValidUser({
    userName: \`u\${TestDataGenerator.generateLongString(48)}\`.slice(0, 50),
  });
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.searchUsers(user.userName!);
  await adminUsersPage.expectUserVisible(user.userName!);
});`,

  258: `test('TC_AP_258 - Verify Username Minimum Length 3', async ({ adminUsersPage }) => {
  const user = AdminUsersData.buildValidUser({
    userName: TestDataGenerator.generateLongString(3),
  });
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.searchUsers(user.userName!);
  await adminUsersPage.expectUserVisible(user.userName!);
});`,

  259: `test('TC_AP_259 - Verify Username Over 50 Shows Validation', async ({ adminUsersPage }) => {
  await adminUsersPage.clickCreateUser();
  await adminUsersPage.fillCreateUserForm({
    ...AdminUsersData.buildValidUser(),
    userName: TestDataGenerator.generateLongString(51),
  });
  await adminUsersPage.submitCreateUser({ waitForApi: false });
  await adminUsersPage.expectValidationMessage(AdminUsersData.validation.usernameLength);
});`,

  260: `test('TC_AP_260 - Verify Username Under 3 Shows Validation', async ({ adminUsersPage }) => {
  await adminUsersPage.clickCreateUser();
  await adminUsersPage.fillCreateUserForm({
    ...AdminUsersData.buildValidUser(),
    userName: 'ab',
  });
  await adminUsersPage.submitCreateUser({ waitForApi: false });
  await adminUsersPage.expectValidationMessage(AdminUsersData.validation.usernameLength);
});`,

  261: `test('TC_AP_261 - Verify Mobile Maximum Length 15', async ({ adminUsersPage }) => {
  const user = AdminUsersData.buildValidUser({ phone: '1'.repeat(15) });
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.searchUsers(user.userName!);
  await adminUsersPage.expectUserVisible(user.userName!);
});`,

  262: `test('TC_AP_262 - Verify Mobile Over 15 Shows Validation', async ({ adminUsersPage }) => {
  await adminUsersPage.clickCreateUser();
  await adminUsersPage.fillCreateUserForm({
    ...AdminUsersData.buildValidUser(),
    phone: '1'.repeat(16),
  });
  await adminUsersPage.submitCreateUser({ waitForApi: false });
  await adminUsersPage.expectValidationMessage(AdminUsersData.validation.mobileMaxLength);
});`,

  263: `test('TC_AP_263 - Verify Mobile Rejects Invalid Characters', async ({ adminUsersPage }) => {
  await adminUsersPage.clickCreateUser();
  await adminUsersPage.fillCreateUserForm({
    ...AdminUsersData.buildValidUser(),
    phone: 'abc@#$',
  });
  await adminUsersPage.submitCreateUser({ waitForApi: false });
  await adminUsersPage.expectValidationMessage(AdminUsersData.validation.invalidMobile);
});`,

  264: `test('TC_AP_264 - Verify Listing Sort By Username Name Created On', async ({ adminUsersPage }) => {
  const { total } = await adminUsersPage.fetchAdminUsers();
  test.skip(total < 2, 'Need at least 2 admin users from API to verify sorting');

  await adminUsersPage.clickSort('Username', 'asc');
  const ascUsernames = await adminUsersPage.getColumnValues('userName');
  await adminUsersPage.clickSort('Username', 'desc');
  const descUsernames = await adminUsersPage.getColumnValues('userName');
  expect(ascUsernames.join(',')).not.toBe(descUsernames.join(','));

  await adminUsersPage.clickSort('Name', 'asc');
  await adminUsersPage.clickSort('Created On', 'asc');
  expect(await adminUsersPage.getVisibleRowCount()).toBeGreaterThan(0);
});`,

  265: `test('TC_AP_265 - Verify Sort Can Be Undone', async ({ adminUsersPage }) => {
  const { total } = await adminUsersPage.fetchAdminUsers();
  test.skip(total < 2, 'Need at least 2 admin users from API to verify sort undo');

  const original = await adminUsersPage.getColumnValues('userName');
  await adminUsersPage.clickSort('Username', 'asc');
  const sorted = await adminUsersPage.getColumnValues('userName');
  await adminUsersPage.clickSort('Username', 'desc');
  const undone = await adminUsersPage.getColumnValues('userName');
  expect(sorted.join(',')).not.toBe(original.join(','));
  expect(undone.join(',')).not.toBe(sorted.join(','));
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

console.log(`Generated ${ids.length} admin user spec files.`);
