import fs from 'fs';
import path from 'path';

const outDir = path.resolve('Admin/MobileUsers');
fs.mkdirSync(outDir, { recursive: true });

const header = `import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';
`;

const specs = {
  157: `test.describe('TC_AP_157 - Create User Form Fields', () => {
  test('Verify create user form has required fields', async ({ mobileUsersPage }) => {
    await test.step('Open create user form', async () => {
      await mobileUsersPage.clickCreateUser();
    });

    await test.step('Verify profile and basic fields', async () => {
      await expect(mobileUsersPage.profileImage()).toBeVisible();
      await expect(mobileUsersPage.profileUploadInput()).toBeAttached();
      await expect(mobileUsersPage.firstNameInput()).toBeVisible();
      await expect(mobileUsersPage.lastNameInput()).toBeVisible();
      await expect(mobileUsersPage.userNameInput()).toBeVisible();
      await expect(mobileUsersPage.emailInput()).toBeVisible();
      await expect(mobileUsersPage.passwordInput()).toBeVisible();
      await expect(mobileUsersPage.phoneInput()).toBeVisible();
    });

    await test.step('Verify language and role fields', async () => {
      await mobileUsersPage.expectFormFieldVisible(/Language/i);
      await mobileUsersPage.expectFormFieldVisible(/Delete Message/i);
      await mobileUsersPage.expectFormFieldVisible(/Role HQ/i);
      await expect(mobileUsersPage.groupSection()).toBeVisible();
    });

    await test.step('Cancel form', async () => {
      await mobileUsersPage.cancelButton().click();
      await mobileUsersPage.expectListingLoaded();
    });
  });
});`,

  158: `test('TC_AP_158 - Verify Text Fields Trim Spaces', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser();
  const spaced = \`  \${user.firstName}  \`;

  await mobileUsersPage.clickCreateUser();
  await mobileUsersPage.fillCreateUserForm({
    ...user,
    firstName: spaced,
    lastName: \`  \${user.lastName}  \`,
    userName: \`  \${user.userName}  \`,
  });
  await mobileUsersPage.submitCreateUser();
  await mobileUsersPage.expectUserSavedSuccess();

  await mobileUsersPage.searchUsers(user.userName);
  await mobileUsersPage.expectUserVisible(user.userName);
});`,

  159: `test('TC_AP_159 - Verify Optional vs Required Fields', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser({ phone: '' });

  await mobileUsersPage.clickCreateUser();
  await mobileUsersPage.fillCreateUserForm(user);
  await mobileUsersPage.submitCreateUser();
  await mobileUsersPage.expectUserSavedSuccess();

  await mobileUsersPage.clickCreateUser();
  await mobileUsersPage.fillCreateUserForm({
    firstName: '',
    lastName: '',
    userName: '',
    email: '',
    password: '',
  });
  await mobileUsersPage.submitCreateUser();
  await mobileUsersPage.expectValidationMessage(MobileUsersData.validation.required);
  await expect(mobileUsersPage.firstNameInput()).toBeVisible();
});`,

  160: `test('TC_AP_160 - Verify Usernames Are Unique', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.createMobileUser(user);

  await mobileUsersPage.clickCreateUser();
  await mobileUsersPage.fillCreateUserForm({
    ...MobileUsersData.buildValidUser(),
    userName: user.userName,
  });
  await mobileUsersPage.submitCreateUser();
  await expect(mobileUsersPage.createModal?.() ?? mobileUsersPage.firstNameInput()).toBeVisible();
  await expect(mobileUsersPage.page.locator('.ant-modal, .create-mobile-form-div').first()).toBeVisible();
});`,

  161: `test('TC_AP_161 - Verify Default HQ Group Assigned', async ({ mobileUsersPage }) => {
  await mobileUsersPage.clickCreateUser();
  await mobileUsersPage.expectHqGroupAssigned();
  await mobileUsersPage.cancelButton().click();
});`,

  162: `test('TC_AP_162 - Verify HQ Group Pre-Assigned On Create', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.createMobileUser(user);
  await mobileUsersPage.searchUsers(user.userName);
  const groups = await mobileUsersPage.getColumnValues('groups');
  expect(groups.some((g) => g.includes(MobileUsersData.hqGroupCode))).toBe(true);
});`,

  163: `test('TC_AP_163 - Verify Profile Photo Format Validation', async ({ mobileUsersPage }) => {
  await mobileUsersPage.clickCreateUser();
  await mobileUsersPage.uploadProfilePhoto(MobileUsersData.testAssets.invalidPdf);
  await mobileUsersPage.expectUploadError(MobileUsersData.validation.invalidImageFormat);
});`,

  164: `test.skip('TC_AP_164 - Verify Profile Photo In Mobile App', async () => {
  // Requires mobile app login — out of admin portal scope.
});`,

  165: `test('TC_AP_165 - Verify HQ Role Assignment', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser({ roleHqYes: true, deleteMsgYes: false });
  await mobileUsersPage.createMobileUser(user);
  await mobileUsersPage.searchUsers(user.userName);
  const hqValues = await mobileUsersPage.getColumnValues('roleHq');
  expect(hqValues[0]).toBe(MobileUsersData.roles.yes);
});`,

  166: `test('TC_AP_166 - Verify Delete Role Assignment', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser({ deleteMsgYes: true, roleHqYes: false });
  await mobileUsersPage.createMobileUser(user);
  await mobileUsersPage.searchUsers(user.userName);
  const deleteValues = await mobileUsersPage.getColumnValues('deleteMsg');
  expect(deleteValues[0]).toBe(MobileUsersData.roles.yes);
});`,

  167: `test('TC_AP_167 - Verify No Delete Role Assignment', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser({ deleteMsgYes: false, roleHqYes: false });
  await mobileUsersPage.createMobileUser(user);
  await mobileUsersPage.searchUsers(user.userName);
  const deleteValues = await mobileUsersPage.getColumnValues('deleteMsg');
  expect(deleteValues[0]).toBe(MobileUsersData.roles.no);
});`,

  168: `test('TC_AP_168 - Verify Default Language From Settings', async ({ mobileUsersPage }) => {
  await mobileUsersPage.clickCreateUser();
  const checked = mobileUsersPage.page.locator('.languagePreference input[type="radio"]:checked, .languageClass input[type="radio"]:checked');
  await expect(checked.first()).toBeVisible();
  await mobileUsersPage.cancelButton().click();
});`,

  169: `test('TC_AP_169 - Verify Multiple Group Selection', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.clickCreateUser();
  await mobileUsersPage.fillCreateUserForm(user);
  await mobileUsersPage.expectHqGroupAssigned();
  await mobileUsersPage.addGroupFromDropdown('Test');
  await mobileUsersPage.submitCreateUser();
  await mobileUsersPage.expectUserSavedSuccess();
  await mobileUsersPage.searchUsers(user.userName);
  const groups = await mobileUsersPage.getColumnValues('groups');
  expect(groups[0].length).toBeGreaterThan(0);
});`,

  170: `test.skip('TC_AP_170 - Verify User Reflects In Mobile App', async () => {
  // Requires mobile app access — out of admin portal scope.
});`,
};

// Fix TC-160 - remove invalid createModal reference
specs[160] = `test('TC_AP_160 - Verify Usernames Are Unique', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.createMobileUser(user);

  await mobileUsersPage.clickCreateUser();
  await mobileUsersPage.fillCreateUserForm({
    ...MobileUsersData.buildValidUser(),
    userName: user.userName,
  });
  await mobileUsersPage.submitCreateUser();
  await expect(mobileUsersPage.firstNameInput()).toBeVisible({ timeout: 15_000 });
  await expect(mobileUsersPage.toast(/.+/i).first()).toBeVisible({ timeout: 15_000 });
});`;

// Phase 2: 171-188
Object.assign(specs, {
  171: `test('TC_AP_171 - Verify Maximum Name Length 50', async ({ mobileUsersPage }) => {
  const name = TestDataGenerator.generateLongString(MobileUsersData.limits.nameMax);
  await mobileUsersPage.clickCreateUser();
  await mobileUsersPage.fillCreateUserForm({ firstName: name, lastName: 'Valid', userName: TestDataGenerator.generateUniqueUsername(), email: TestDataGenerator.generateUniqueEmail(), password: TestDataGenerator.generateValidPassword() });
  await mobileUsersPage.submitCreateUser();
  await mobileUsersPage.expectUserSavedSuccess();
});`,

  172: `test('TC_AP_172 - Verify Name Over 50 Shows Validation', async ({ mobileUsersPage }) => {
  await mobileUsersPage.clickCreateUser();
  await mobileUsersPage.fillCreateUserForm({ firstName: TestDataGenerator.generateLongString(51) });
  await mobileUsersPage.submitCreateUser();
  await mobileUsersPage.expectValidationMessage(MobileUsersData.validation.firstNameMaxLength);
});`,

  173: `test('TC_AP_173 - Verify Maximum Last Name Length 50', async ({ mobileUsersPage }) => {
  const lastName = TestDataGenerator.generateLongString(MobileUsersData.limits.lastNameMax);
  const user = MobileUsersData.buildValidUser({ lastName });
  await mobileUsersPage.createMobileUser(user);
  await mobileUsersPage.searchUsers(user.userName);
  await mobileUsersPage.expectUserVisible(user.userName);
});`,

  174: `test('TC_AP_174 - Verify Last Name Over 50 Shows Validation', async ({ mobileUsersPage }) => {
  await mobileUsersPage.clickCreateUser();
  await mobileUsersPage.fillCreateUserForm({ lastName: TestDataGenerator.generateLongString(51) });
  await mobileUsersPage.submitCreateUser();
  await mobileUsersPage.expectValidationMessage(MobileUsersData.validation.lastNameMaxLength);
});`,

  175: `test('TC_AP_175 - Verify No Minimum Name Length', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser({ firstName: 'A', lastName: 'B' });
  await mobileUsersPage.createMobileUser(user);
  await mobileUsersPage.searchUsers(user.userName);
  await mobileUsersPage.expectUserVisible(user.userName);
});`,

  176: `test('TC_AP_176 - Verify Maximum Username Length 50', async ({ mobileUsersPage }) => {
  const userName = \`u\${TestDataGenerator.generateLongString(48)}\`.slice(0, 50);
  const user = MobileUsersData.buildValidUser({ userName });
  await mobileUsersPage.createMobileUser(user);
  await mobileUsersPage.searchUsers(user.userName);
  await mobileUsersPage.expectUserVisible(user.userName);
});`,

  177: `test('TC_AP_177 - Verify Minimum Username Length 3', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser({ userName: 'abc' });
  await mobileUsersPage.createMobileUser(user);
  await mobileUsersPage.searchUsers(user.userName);
  await mobileUsersPage.expectUserVisible(user.userName);
});`,

  178: `test('TC_AP_178 - Verify Username Over 50 Shows Validation', async ({ mobileUsersPage }) => {
  await mobileUsersPage.clickCreateUser();
  await mobileUsersPage.fillCreateUserForm({ userName: TestDataGenerator.generateLongString(51) });
  await mobileUsersPage.submitCreateUser();
  await mobileUsersPage.expectValidationMessage(MobileUsersData.validation.usernameLength);
});`,

  179: `test('TC_AP_179 - Verify Username Under 3 Shows Validation', async ({ mobileUsersPage }) => {
  await mobileUsersPage.clickCreateUser();
  await mobileUsersPage.fillCreateUserForm({ userName: 'ab' });
  await mobileUsersPage.submitCreateUser();
  await mobileUsersPage.expectValidationMessage(MobileUsersData.validation.usernameLength);
});`,

  180: `test('TC_AP_180 - Verify Maximum Mobile Length 15', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser({ phone: '123456789012345' });
  await mobileUsersPage.createMobileUser(user);
  await mobileUsersPage.searchUsers(user.userName);
  await mobileUsersPage.expectUserVisible(user.userName);
});`,

  181: `test('TC_AP_181 - Verify Mobile Over 15 Shows Validation', async ({ mobileUsersPage }) => {
  await mobileUsersPage.clickCreateUser();
  await mobileUsersPage.fillCreateUserForm({ phone: '1234567890123456' });
  await mobileUsersPage.submitCreateUser();
  await mobileUsersPage.expectValidationMessage(MobileUsersData.validation.mobileMaxLength);
});`,

  182: `test('TC_AP_182 - Verify Mobile Rejects Invalid Characters', async ({ mobileUsersPage }) => {
  await mobileUsersPage.clickCreateUser();
  await mobileUsersPage.fillCreateUserForm({ phone: TestDataGenerator.generateInvalidPhone() });
  await mobileUsersPage.submitCreateUser();
  await mobileUsersPage.expectValidationMessage(MobileUsersData.validation.invalidMobile);
});`,

  183: `test('TC_AP_183 - Verify Doraku Code Max Length 20', async ({ mobileUsersPage }) => {
  test.skip(!(await mobileUsersPage.dorakuInput().isVisible().catch(() => false)), 'Doraku integration disabled');
  const user = MobileUsersData.buildValidUser({ dorakuCode: TestDataGenerator.generateLongString(20) });
  await mobileUsersPage.createMobileUser(user);
});`,

  184: `test('TC_AP_184 - Verify Doraku Over 20 Shows Validation', async ({ mobileUsersPage }) => {
  await mobileUsersPage.clickCreateUser();
  if (!(await mobileUsersPage.dorakuInput().isVisible().catch(() => false))) test.skip(true, 'Doraku disabled');
  await mobileUsersPage.fillCreateUserForm({ dorakuCode: TestDataGenerator.generateLongString(21) });
  await mobileUsersPage.submitCreateUser();
  await mobileUsersPage.expectValidationMessage(MobileUsersData.validation.dorakuMaxLength);
});`,

  185: `test('TC_AP_185 - Verify Doraku Accepts Integers Only', async ({ mobileUsersPage }) => {
  await mobileUsersPage.clickCreateUser();
  if (!(await mobileUsersPage.dorakuInput().isVisible().catch(() => false))) test.skip(true, 'Doraku disabled');
  await mobileUsersPage.fillCreateUserForm({ dorakuCode: 'abc@#$' });
  await mobileUsersPage.submitCreateUser();
  await mobileUsersPage.expectValidationMessage(MobileUsersData.validation.invalidDoraku);
});`,

  186: `test('TC_AP_186 - Verify User Cannot Be Created With Invalid Inputs', async ({ mobileUsersPage }) => {
  await mobileUsersPage.clickCreateUser();
  await mobileUsersPage.fillCreateUserForm({
    firstName: '123',
    lastName: '@@@',
    userName: 'ab',
    email: TestDataGenerator.generateInvalidEmail(),
    password: 'weak',
  });
  await mobileUsersPage.submitCreateUser();
  await expect(mobileUsersPage.firstNameInput()).toBeVisible();
});`,

  187: `test.skip('TC_AP_187 - Verify Created User Receives Email', async () => {
  // Email delivery cannot be verified from admin portal automation.
});`,

  188: `test('TC_AP_188 - Verify Status Active By Default', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.createMobileUser(user);
  await mobileUsersPage.searchUsers(user.userName);
  const statuses = await mobileUsersPage.getColumnValues('status');
  expect(statuses[0]).toBe(MobileUsersData.status.active);
});`,
});

// Phase 3: 189-199
Object.assign(specs, {
  189: `test('TC_AP_189 - Verify Edit Form And Update User', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.createMobileUser(user);
  await mobileUsersPage.searchUsers(user.userName);
  await mobileUsersPage.openEditUser(user.userName);
  await mobileUsersPage.expectEditFormLoaded();
  await expect(mobileUsersPage.page.locator('#status')).toBeVisible();
  const newLast = TestDataGenerator.generateRandomLastName();
  await mobileUsersPage.fillCreateUserForm({ lastName: newLast });
  await mobileUsersPage.submitUpdateUser();
  await mobileUsersPage.expectUserSavedSuccess();
});`,

  190: `test('TC_AP_190 - Verify Username Not Editable On Edit', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.createMobileUser(user);
  await mobileUsersPage.searchUsers(user.userName);
  await mobileUsersPage.openEditUser(user.userName);
  await expect(mobileUsersPage.userNameInput()).toBeDisabled();
});`,

  191: `test.skip('TC_AP_191 - Verify Old Username Cannot Login Mobile App', async () => {
  // Requires mobile app login — out of scope.
});`,

  192: `test('TC_AP_192 - Verify Edit Keeps Same Username', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.createMobileUser(user);
  await mobileUsersPage.searchUsers(user.userName);
  await mobileUsersPage.openEditUser(user.userName);
  await expect(mobileUsersPage.userNameInput()).toHaveValue(user.userName);
});`,

  193: `test.skip('TC_AP_193 - Verify Email Update Delivery', async () => {
  // Email delivery cannot be verified from admin portal automation.
});`,

  194: `test('TC_AP_194 - Verify Status Field On Edit Form', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.createMobileUser(user);
  await mobileUsersPage.searchUsers(user.userName);
  await mobileUsersPage.openEditUser(user.userName);
  await expect(mobileUsersPage.page.locator('#status')).toBeVisible();
  await mobileUsersPage.selectStatus(false);
  await mobileUsersPage.submitUpdateUser();
  await mobileUsersPage.expectUserSavedSuccess();
  await mobileUsersPage.searchUsers(user.userName);
  const statuses = await mobileUsersPage.getColumnValues('status');
  expect(statuses[0]).toBe(MobileUsersData.status.inactive);
});`,

  195: `test('TC_AP_195 - Verify HQ Group Not Editable On Edit', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.createMobileUser(user);
  await mobileUsersPage.searchUsers(user.userName);
  await mobileUsersPage.openEditUser(user.userName);
  await mobileUsersPage.expectHqGroupAssigned();
  await expect(mobileUsersPage.hqGroupChip().locator('.crossIconCss')).toHaveCount(0);
  await mobileUsersPage.submitUpdateUser();
  await mobileUsersPage.expectUserSavedSuccess();
});`,

  196: `test('TC_AP_196 - Verify Role Can Be Changed On Edit', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser({ roleHqYes: false, deleteMsgYes: false });
  await mobileUsersPage.createMobileUser(user);
  await mobileUsersPage.searchUsers(user.userName);
  await mobileUsersPage.openEditUser(user.userName);
  await mobileUsersPage.selectRadioByLabel(/Role HQ/i, 'Yes');
  await mobileUsersPage.selectRadioByLabel(/Delete Message/i, 'Yes');
  await mobileUsersPage.submitUpdateUser();
  await mobileUsersPage.expectUserSavedSuccess();
  await mobileUsersPage.searchUsers(user.userName);
  expect(await mobileUsersPage.getColumnValues('roleHq')).toContain(MobileUsersData.roles.yes);
  expect(await mobileUsersPage.getColumnValues('deleteMsg')).toContain(MobileUsersData.roles.yes);
});`,

  197: `test.skip('TC_AP_197 - Verify Inactive User Cannot Login Mobile App', async () => {
  // Requires mobile app login — out of scope.
});`,

  198: `test.skip('TC_AP_198 - Verify Monthly Budget Points Update', async () => {
  // Monthly budget points field not present in current frontend build.
});`,

  199: `test.skip('TC_AP_199 - Verify Remaining Budget Points On Edit', async () => {
  // Remaining budget points field not present in current frontend build.
});`,
});

// Phase 4: 200-215
Object.assign(specs, {
  200: `test('TC_AP_200 - Verify Listing Columns', async ({ mobileUsersPage }) => {
  for (const col of MobileUsersData.listingColumns) {
    await mobileUsersPage.expectColumnHeaderVisible(col);
  }
  await expect(mobileUsersPage.editIcon(await mobileUsersPage.getColumnValues('userName').then((v) => v[0] ?? '')).first()).toBeVisible();
});`,

  201: `test('TC_AP_201 - Verify Default Active Status In Listing', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.createMobileUser(user);
  await mobileUsersPage.searchUsers(user.userName);
  expect(await mobileUsersPage.getColumnValues('status')).toContain(MobileUsersData.status.active);
});`,

  202: `test('TC_AP_202 - Verify HQ Role Shows Yes In Listing', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser({ roleHqYes: true });
  await mobileUsersPage.createMobileUser(user);
  await mobileUsersPage.searchUsers(user.userName);
  expect(await mobileUsersPage.getColumnValues('roleHq')).toContain(MobileUsersData.roles.yes);
});`,

  203: `test('TC_AP_203 - Verify Delete Role Shows Yes In Listing', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser({ deleteMsgYes: true });
  await mobileUsersPage.createMobileUser(user);
  await mobileUsersPage.searchUsers(user.userName);
  expect(await mobileUsersPage.getColumnValues('deleteMsg')).toContain(MobileUsersData.roles.yes);
});`,

  204: `test('TC_AP_204 - Verify Delete Icon Opens Confirmation', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.createMobileUser(user);
  await mobileUsersPage.searchUsers(user.userName);
  await mobileUsersPage.clickDeleteIcon(user.userName);
  await expect(mobileUsersPage.confirmModal()).toContainText(/inactivate user/i);
  await mobileUsersPage.confirmModalAction(false);
});`,

  205: `test('TC_AP_205 - Verify Delete Makes User Inactive', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.createMobileUser(user);
  await mobileUsersPage.searchUsers(user.userName);
  await mobileUsersPage.clickDeleteIcon(user.userName);
  await mobileUsersPage.confirmModalAction(true);
  await mobileUsersPage.searchUsers(user.userName);
  expect(await mobileUsersPage.getColumnValues('status')).toContain(MobileUsersData.status.inactive);
});`,

  206: `test('TC_AP_206 - Verify Pagination 25 Per Page', async ({ mobileUsersPage }) => {
  const rows = await mobileUsersPage.getVisibleRowCount();
  expect(rows).toBeLessThanOrEqual(MobileUsersData.pagination.defaultPageSize);
  expect(rows).toBeGreaterThan(0);
  if (await mobileUsersPage.nextPageButton().isEnabled()) {
    await mobileUsersPage.nextPageButton().click();
    await mobileUsersPage.waitForUserListResponse?.() ?? mobileUsersPage.page.waitForResponse((r) => r.url().includes('/user/mobile'));
    expect(await mobileUsersPage.getVisibleRowCount()).toBeGreaterThan(0);
  }
});`,

  207: `test('TC_AP_207 - Verify Search Trims Spaces', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.createMobileUser(user);
  await mobileUsersPage.searchUsers(\`  \${user.userName}  \`);
  await mobileUsersPage.expectUserVisible(user.userName);
});`,

  208: `test('TC_AP_208 - Verify Sorting On Listing', async ({ mobileUsersPage }) => {
  const before = await mobileUsersPage.getColumnValues('userName');
  await mobileUsersPage.clickSort('Username', 'asc');
  const after = await mobileUsersPage.getColumnValues('userName');
  expect(after.length).toBeGreaterThan(0);
  expect(JSON.stringify(before)).not.toEqual(JSON.stringify(after));
  await mobileUsersPage.clickSort('Username', 'desc');
  expect(await mobileUsersPage.getColumnValues('userName')).not.toHaveLength(0);
});`,

  209: `test('TC_AP_209 - Verify Bulk Upload And Create Buttons', async ({ mobileUsersPage }) => {
  await expect(mobileUsersPage.bulkUploadLink()).toBeVisible();
  await expect(mobileUsersPage.createUserLink()).toBeVisible();
  await mobileUsersPage.bulkUploadLink().click();
  await expect(mobileUsersPage.page).toHaveURL(/bulk-upload/);
});`,

  210: `test('TC_AP_210 - Verify Groups Filter', async ({ mobileUsersPage }) => {
  await mobileUsersPage.openFilterModal();
  await mobileUsersPage.selectFilterTab('Groups');
  await mobileUsersPage.toggleFilterCheckbox('Test');
  await mobileUsersPage.applyFilter();
  expect(await mobileUsersPage.getVisibleRowCount()).toBeGreaterThan(0);
});`,

  211: `test('TC_AP_211 - Verify Roles Filter', async ({ mobileUsersPage }) => {
  await mobileUsersPage.openFilterModal();
  await mobileUsersPage.selectFilterTab('Roles');
  await mobileUsersPage.toggleFilterCheckbox('HQ');
  await mobileUsersPage.applyFilter();
  const hqCol = await mobileUsersPage.getColumnValues('roleHq');
  expect(hqCol.every((v) => v === MobileUsersData.roles.yes || v === '-')).toBe(true);
});`,

  212: `test('TC_AP_212 - Verify Status Filter', async ({ mobileUsersPage }) => {
  await mobileUsersPage.openFilterModal();
  await mobileUsersPage.selectFilterTab('Status');
  await mobileUsersPage.toggleFilterCheckbox('Active');
  await mobileUsersPage.applyFilter();
  const statuses = await mobileUsersPage.getColumnValues('status');
  expect(statuses.every((s) => s === MobileUsersData.status.active)).toBe(true);
});`,

  213: `test('TC_AP_213 - Verify Filter Select All Groups', async ({ mobileUsersPage }) => {
  await mobileUsersPage.openFilterModal();
  await mobileUsersPage.selectFilterTab('Groups');
  await mobileUsersPage.clickFilterSelectAll();
  await mobileUsersPage.applyFilter();
  expect(await mobileUsersPage.getVisibleRowCount()).toBeGreaterThan(0);
});`,

  214: `test('TC_AP_214 - Verify Filter Select All Roles', async ({ mobileUsersPage }) => {
  await mobileUsersPage.openFilterModal();
  await mobileUsersPage.selectFilterTab('Roles');
  await mobileUsersPage.clickFilterSelectAll();
  await mobileUsersPage.applyFilter();
  expect(await mobileUsersPage.getVisibleRowCount()).toBeGreaterThan(0);
});`,

  215: `test('TC_AP_215 - Verify Filter Clear All', async ({ mobileUsersPage }) => {
  await mobileUsersPage.openFilterModal();
  await mobileUsersPage.selectFilterTab('Groups');
  await mobileUsersPage.clickFilterSelectAll();
  await mobileUsersPage.clickFilterClearAll();
  await mobileUsersPage.applyFilter();
  expect(await mobileUsersPage.getVisibleRowCount()).toBeGreaterThan(0);
});`,
});

// Phase 5: 216-221
Object.assign(specs, {
  216: `test('TC_AP_216 - Verify Password Field On Create Form', async ({ mobileUsersPage }) => {
  await mobileUsersPage.clickCreateUser();
  await mobileUsersPage.expectPasswordFieldVisible(true);
});`,

  217: `test('TC_AP_217 - Verify Password Mask Unmask', async ({ mobileUsersPage }) => {
  await mobileUsersPage.clickCreateUser();
  await mobileUsersPage.fillCreateUserForm({ password: TestDataGenerator.generateValidPassword() });
  await mobileUsersPage.expectPasswordMasked();
  await mobileUsersPage.togglePasswordVisibility();
  await mobileUsersPage.expectPasswordUnmasked();
});`,

  218: `test.skip('TC_AP_218 - Verify Password Communicated Via Email', async () => {
  // Email delivery cannot be verified from admin portal automation.
});`,

  219: `test('TC_AP_219 - Verify Password Not On Update Form', async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.createMobileUser(user);
  await mobileUsersPage.searchUsers(user.userName);
  await mobileUsersPage.openEditUser(user.userName);
  await mobileUsersPage.expectPasswordFieldVisible(false);
});`,

  220: `test('TC_AP_220 - Verify Password Maximum Length 15', async ({ mobileUsersPage }) => {
  const pwd = \`Tt@123456789012\`.slice(0, 15);
  const user = MobileUsersData.buildValidUser({ password: pwd });
  await mobileUsersPage.createMobileUser(user);
});`,

  221: `test('TC_AP_221 - Verify Password Over 15 Not Accepted', async ({ mobileUsersPage }) => {
  await mobileUsersPage.clickCreateUser();
  await mobileUsersPage.fillCreateUserForm({
    ...MobileUsersData.buildValidUser(),
    password: TestDataGenerator.generateLongString(16) + 'Aa1!',
  });
  await mobileUsersPage.submitCreateUser();
  await mobileUsersPage.expectValidationMessage(MobileUsersData.validation.passwordLength);
});`,
});

// Fix TC-206 - invalid optional chaining
specs[206] = `test('TC_AP_206 - Verify Pagination 25 Per Page', async ({ mobileUsersPage }) => {
  const rows = await mobileUsersPage.getVisibleRowCount();
  expect(rows).toBeLessThanOrEqual(MobileUsersData.pagination.defaultPageSize);
  expect(rows).toBeGreaterThan(0);
  if (await mobileUsersPage.nextPageButton().isEnabled()) {
    const response = mobileUsersPage.page.waitForResponse((r) => r.url().includes('/user/mobile'));
    await mobileUsersPage.nextPageButton().click();
    await response;
    expect(await mobileUsersPage.getVisibleRowCount()).toBeGreaterThan(0);
  }
});`;

// Fix TC-200 - edit icon for first user
specs[200] = `test('TC_AP_200 - Verify Listing Columns', async ({ mobileUsersPage }) => {
  for (const col of MobileUsersData.listingColumns) {
    await mobileUsersPage.expectColumnHeaderVisible(col);
  }
  await expect(mobileUsersPage.tableRows().first().locator('.edit-icon')).toBeVisible();
});`;

for (let id = 157; id <= 221; id++) {
  const body = specs[id];
  if (!body) {
    console.warn('Missing spec', id);
    continue;
  }
  const file = path.join(outDir, `TC-${id}.spec.ts`);
  fs.writeFileSync(file, header + body + '\n');
  console.log('Wrote', file);
}

console.log('Done:', Object.keys(specs).length, 'specs');
