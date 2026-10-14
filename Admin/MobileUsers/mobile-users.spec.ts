import { test, expect } from "../fixtures/mobile-users.fixture";
import { MobileUsersData } from "../data/MobileUsersData";
import { BulkUploadCsvBuilder } from "../utils/BulkUploadCsvBuilder";
import { TestDataGenerator } from "../utils/TestDataGenerator";
import fs from "fs";
import os from "os";
import path from "path";

test.describe("TC_AP_157 - Create User Form Fields", () => {
  test("Verify create user form has required fields", async ({
    mobileUsersPage,
  }) => {
    await test.step("Open create user form", async () => {
      await mobileUsersPage.clickCreateUser();
    });

    await test.step("Verify profile and basic fields", async () => {
      await expect(mobileUsersPage.profileImage()).toBeVisible();
      await expect(mobileUsersPage.profileUploadInput()).toBeAttached();
      await expect(mobileUsersPage.firstNameInput()).toBeVisible();
      await expect(mobileUsersPage.lastNameInput()).toBeVisible();
      await expect(mobileUsersPage.userNameInput()).toBeVisible();
      await expect(mobileUsersPage.emailInput()).toBeVisible();
      await expect(mobileUsersPage.passwordInput()).toBeVisible();
      await expect(mobileUsersPage.phoneInput()).toBeVisible();
    });

    await test.step("Verify language, roles, and group selection", async () => {
      await mobileUsersPage.expectFormFieldVisible(/Language/i);
      await mobileUsersPage.expectFormFieldVisible(/Delete Message/i);
      await mobileUsersPage.expectFormFieldVisible(/Role HQ/i);
      await expect(mobileUsersPage.groupSection()).toBeVisible();
    });

    await test.step("Cancel form", async () => {
      await mobileUsersPage.cancelButton().click();
      await mobileUsersPage.expectListingLoaded();
    });
  });
});

test("TC_AP_158 - Verify Text Fields Trim Spaces", async ({
  mobileUsersPage,
}) => {
  const user = MobileUsersData.buildValidUser();
  const spacedFirst = `${user.firstName}  `;

  await mobileUsersPage.clickCreateUser();
  await mobileUsersPage.fillCreateUserForm({
    ...user,
    firstName: spacedFirst,
    lastName: `${user.lastName}  `,
    userName: `${user.userName}  `,
  });
  await mobileUsersPage.submitCreateUser();

  await mobileUsersPage.searchUsers(user.userName);
  await mobileUsersPage.expectUserVisible(user.userName);
});

test("TC_AP_159 - Verify Optional vs Required Fields", async ({
  mobileUsersPage,
}) => {
  const user = MobileUsersData.buildValidUser({ phone: "" });

  await test.step("Create user without optional mobile number", async () => {
    await mobileUsersPage.createMobileUser(user);
    await mobileUsersPage.searchUsers(user.userName);
    await mobileUsersPage.expectUserVisible(user.userName);
  });

  await test.step("Reject create when required fields are empty", async () => {
    await mobileUsersPage.clickCreateUser();
    await mobileUsersPage.fillCreateUserForm({
      firstName: "",
      lastName: "",
      userName: "",
      email: "",
      password: "",
    });
    await mobileUsersPage.submitCreateUser({ waitForApi: false });
    await mobileUsersPage.expectValidationMessage(
      MobileUsersData.validation.required,
    );
    await expect(mobileUsersPage.firstNameInput()).toBeVisible();
  });
});

test("TC_AP_160 - Verify Usernames Are Unique", async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.createMobileUserViaApi(user);

  await mobileUsersPage.clickCreateUser();
  await mobileUsersPage.fillCreateUserForm({
    ...MobileUsersData.buildValidUser(),
    userName: user.userName,
  });
  await mobileUsersPage.submitCreateUser({ waitForApi: false });

  await expect(mobileUsersPage.firstNameInput()).toBeVisible({
    timeout: 15_000,
  });
  await expect(
    mobileUsersPage.page.locator(".ant-message-notice-content").first(),
  ).toBeVisible({
    timeout: 15_000,
  });
});

test("TC_AP_161 - Verify Default HQ Group Assigned", async ({
  mobileUsersPage,
}) => {
  await mobileUsersPage.clickCreateUser();
  await mobileUsersPage.expectHqGroupAssigned();
  await mobileUsersPage.cancelButton().click();
  await mobileUsersPage.expectListingLoaded();
});

test("TC_AP_162 - Verify HQ Group Pre-Assigned On Create", async ({
  mobileUsersPage,
}) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.createMobileUser(user);

  const hqGroup = await mobileUsersPage.getApiHqGroup();
  await mobileUsersPage.searchUsers(user.userName);
  const groups = await mobileUsersPage.getColumnValues("groups");
  expect(
    groups.some((g) => g.includes(hqGroup.code) || g.includes(hqGroup.name)),
  ).toBe(true);
});

test("TC_AP_163 - Verify Profile Photo Format Validation", async ({
  mobileUsersPage,
}) => {
  await mobileUsersPage.clickCreateUser();
  await mobileUsersPage.uploadProfilePhoto(
    MobileUsersData.testAssets.invalidPdf,
  );
  await mobileUsersPage.expectUploadError(
    MobileUsersData.validation.invalidImageFormat,
  );
});

test("TC_AP_165 - Verify HQ Role Assignment", async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser({
    roleHqYes: true,
    deleteMsgYes: false,
  });
  await mobileUsersPage.createMobileUser(user);

  await mobileUsersPage.searchUsers(user.userName);
  expect(await mobileUsersPage.getColumnValues("roleHq")).toContain(
    MobileUsersData.roles.yes,
  );
});

test("TC_AP_166 - Verify Delete Role Assignment", async ({
  mobileUsersPage,
}) => {
  const user = MobileUsersData.buildValidUser({
    deleteMsgYes: true,
    roleHqYes: false,
  });
  await mobileUsersPage.createMobileUser(user);

  await mobileUsersPage.searchUsers(user.userName);
  expect(await mobileUsersPage.getColumnValues("deleteMsg")).toContain(
    MobileUsersData.roles.yes,
  );
});

test("TC_AP_167 - Verify No Delete Role Assignment", async ({
  mobileUsersPage,
}) => {
  const user = MobileUsersData.buildValidUser({
    deleteMsgYes: false,
    roleHqYes: false,
  });
  await mobileUsersPage.createMobileUser(user);

  await mobileUsersPage.searchUsers(user.userName);
  expect(await mobileUsersPage.getColumnValues("deleteMsg")).toContain(
    MobileUsersData.roles.no,
  );
});

test("TC_AP_168 - Verify Default Language From Settings", async ({
  mobileUsersPage,
}) => {
  await mobileUsersPage.clickCreateUser();
  const checked = mobileUsersPage.page.locator(
    '.languagePreference input[type="radio"]:checked, .languageClass input[type="radio"]:checked',
  );
  await expect(checked.first()).toBeVisible();
  await mobileUsersPage.cancelButton().click();
});

test("TC_AP_169 - Verify Multiple Group Selection", async ({
  mobileUsersPage,
}) => {
  const user = MobileUsersData.buildValidUser();
  const group = await mobileUsersPage.getApiNonHqGroupWithMembers();

  await mobileUsersPage.clickCreateUser();
  await mobileUsersPage.fillCreateUserForm(user);
  await mobileUsersPage.expectHqGroupAssigned();
  await mobileUsersPage.addGroupFromDropdown(group);
  await mobileUsersPage.submitCreateUser();

  await mobileUsersPage.searchUsers(user.userName);
  const groups = await mobileUsersPage.getColumnValues("groups");
  expect(groups[0]?.length).toBeGreaterThan(0);
});

test("TC_AP_171 - Verify Maximum Name Length 50", async ({
  mobileUsersPage,
}) => {
  const name = TestDataGenerator.generateLongString(
    MobileUsersData.limits.nameMax,
  );
  const user = MobileUsersData.buildValidUser({ firstName: name });

  await test.step("Create user with 50-character first name", async () => {
    await mobileUsersPage.createMobileUser(user);
  });

  await test.step("Verify user appears in listing", async () => {
    await mobileUsersPage.searchUsers(user.userName);
    await mobileUsersPage.expectUserVisible(user.userName);
  });
});

test("TC_AP_172 - Verify Name Over 50 Shows Validation", async ({
  mobileUsersPage,
}) => {
  await test.step("Submit create form with 51-character first name", async () => {
    await mobileUsersPage.clickCreateUser();
    await mobileUsersPage.fillCreateUserForm({
      firstName: TestDataGenerator.generateLongString(51),
    });
    await mobileUsersPage.submitCreateUser({ waitForApi: false });
  });

  await test.step("Verify max length validation message", async () => {
    await mobileUsersPage.expectValidationMessage(
      MobileUsersData.validation.firstNameMaxLength,
    );
  });
});

test("TC_AP_173 - Verify Maximum Last Name Length 50", async ({
  mobileUsersPage,
}) => {
  const lastName = TestDataGenerator.generateLongString(
    MobileUsersData.limits.lastNameMax,
  );
  const user = MobileUsersData.buildValidUser({ lastName });

  await test.step("Create user with 50-character last name", async () => {
    await mobileUsersPage.clickCreateUser();
    await mobileUsersPage.fillCreateUserForm(user);
    await mobileUsersPage.triggerFieldValidation();
    await mobileUsersPage.submitCreateUser();
  });

  await test.step("Verify user appears in listing", async () => {
    await mobileUsersPage.searchUsers(user.userName);
    await mobileUsersPage.expectUserVisible(user.userName);
  });
});

test("TC_AP_174 - Verify Last Name Over 50 Shows Validation", async ({
  mobileUsersPage,
}) => {
  await test.step("Submit create form with 51-character last name", async () => {
    await mobileUsersPage.clickCreateUser();
    await mobileUsersPage.fillCreateUserForm({
      lastName: TestDataGenerator.generateLongString(51),
    });
    await mobileUsersPage.submitCreateUser({ waitForApi: false });
  });

  await test.step("Verify max length validation message", async () => {
    await mobileUsersPage.expectValidationMessage(
      MobileUsersData.validation.lastNameMaxLength,
    );
  });
});

test("TC_AP_175 - Verify No Minimum Name Length", async ({
  mobileUsersPage,
}) => {
  const user = MobileUsersData.buildValidUser({
    firstName: "A",
    lastName: "B",
  });

  await test.step("Create user with single-character name fields", async () => {
    await mobileUsersPage.clickCreateUser();
    await mobileUsersPage.fillCreateUserForm(user);
    await mobileUsersPage.triggerFieldValidation();
    await mobileUsersPage.submitCreateUser();
  });

  await test.step("Verify user appears in listing", async () => {
    await mobileUsersPage.searchUsers(user.userName);
    await mobileUsersPage.expectUserVisible(user.userName);
  });
});

test("TC_AP_176 - Verify Maximum Username Length 50", async ({
  mobileUsersPage,
}) => {
  const userName =
    `${TestDataGenerator.generateUniqueUsername()}${TestDataGenerator.generateLongString(30)}`.slice(
      0,
      MobileUsersData.limits.usernameMax,
    );
  const user = MobileUsersData.buildValidUser({ userName });

  await test.step("Create user with 50-character username", async () => {
    await mobileUsersPage.clickCreateUser();
    await mobileUsersPage.fillCreateUserForm(user);
    await mobileUsersPage.triggerFieldValidation();
    await mobileUsersPage.submitCreateUser();
  });

  await test.step("Verify user appears in listing", async () => {
    await mobileUsersPage.searchUsers(user.userName);
    await mobileUsersPage.expectUserVisible(user.userName);
  });
});

test("TC_AP_177 - Verify Minimum Username Length 3", async ({
  mobileUsersPage,
}) => {
  const user = MobileUsersData.buildValidUser({ userName: "abc" });

  await test.step("Create user with 3-character username", async () => {
    await mobileUsersPage.clickCreateUser();
    await mobileUsersPage.fillCreateUserForm(user);
    await mobileUsersPage.triggerFieldValidation();
    await mobileUsersPage.submitCreateUser();
  });

  await test.step("Verify user appears in listing", async () => {
    await mobileUsersPage.searchUsers(user.userName);
    await mobileUsersPage.expectUserVisible(user.userName);
  });
});

test("TC_AP_178 - Verify Username Over 50 Shows Validation", async ({
  mobileUsersPage,
}) => {
  await test.step("Enter 51-character username and blur to trigger validation", async () => {
    await mobileUsersPage.clickCreateUser();
    await mobileUsersPage.fillCreateUserForm({
      userName: TestDataGenerator.generateLongString(51),
    });
  });

  await test.step("Verify username length validation message", async () => {
    await mobileUsersPage.expectValidationMessage(
      MobileUsersData.validation.usernameLength,
    );
  });
});

test("TC_AP_179 - Verify Username Under 3 Shows Validation", async ({
  mobileUsersPage,
}) => {
  await test.step("Enter 2-character username and blur to trigger validation", async () => {
    await mobileUsersPage.clickCreateUser();
    await mobileUsersPage.fillCreateUserForm({ userName: "ab" });
  });

  await test.step("Verify username length validation message", async () => {
    await mobileUsersPage.expectValidationMessage(
      MobileUsersData.validation.usernameLength,
    );
  });
});

test("TC_AP_180 - Verify Valid JP/SG/TH Mobile Number Is Accepted", async ({
  mobileUsersPage,
}) => {
  const user = MobileUsersData.buildValidUser({
    phone: MobileUsersData.validation.validMobileExample,
  });

  await test.step("Create user with a valid Japan mobile number", async () => {
    await mobileUsersPage.clickCreateUser();
    await mobileUsersPage.fillCreateUserForm(user);
    await mobileUsersPage.triggerFieldValidation();
    await mobileUsersPage.submitCreateUser();
  });

  await test.step("Verify user appears in listing", async () => {
    await mobileUsersPage.searchUsers(user.userName);
    await mobileUsersPage.expectUserVisible(user.userName);
  });
});

test("TC_AP_181 - Verify Invalid Country Mobile Shows Validation", async ({
  mobileUsersPage,
}) => {
  await test.step("Submit create form with a non JP/SG/TH mobile number", async () => {
    await mobileUsersPage.clickCreateUser();
    await mobileUsersPage.fillCreateUserForm({ phone: "123456789012345" });
    await mobileUsersPage.submitCreateUser({ waitForApi: false });
  });

  await test.step("Verify country mobile validation message", async () => {
    await mobileUsersPage.expectValidationMessage(
      MobileUsersData.validation.invalidMobile,
    );
  });
});

test("TC_AP_182 - Verify Mobile Rejects Invalid Characters", async ({
  mobileUsersPage,
}) => {
  await test.step("Submit create form with invalid mobile number", async () => {
    await mobileUsersPage.clickCreateUser();
    await mobileUsersPage.fillCreateUserForm({
      phone: TestDataGenerator.generateInvalidPhone(),
    });
    await mobileUsersPage.submitCreateUser({ waitForApi: false });
  });

  await test.step("Verify invalid mobile validation message", async () => {
    await mobileUsersPage.expectValidationMessage(
      MobileUsersData.validation.invalidMobile,
    );
  });
});

test("TC_AP_186 - Verify User Cannot Be Created With Invalid Inputs", async ({
  mobileUsersPage,
}) => {
  await test.step("Submit create form with multiple invalid fields", async () => {
    await mobileUsersPage.clickCreateUser();
    await mobileUsersPage.fillCreateUserForm({
      firstName: "123",
      lastName: "@@@",
      userName: "ab",
      email: TestDataGenerator.generateInvalidEmail(),
      password: "weak",
    });
    await mobileUsersPage.submitCreateUser({ waitForApi: false });
  });

  await test.step("Verify form remains open and user is not created", async () => {
    await expect(mobileUsersPage.firstNameInput()).toBeVisible();
    await expect(mobileUsersPage.page).toHaveURL(
      new RegExp(MobileUsersData.paths.create),
    );
  });
});

test("TC_AP_188 - Verify Status Active By Default", async ({
  mobileUsersPage,
}) => {
  const user = MobileUsersData.buildValidUser();

  await test.step("Create a new mobile user", async () => {
    await mobileUsersPage.createMobileUser(user);
  });

  await test.step("Verify status is Active in listing", async () => {
    await mobileUsersPage.searchUsers(user.userName);
    const statuses = await mobileUsersPage.getColumnValues("status");
    expect(statuses[0]).toBe(MobileUsersData.status.active);
  });
});

test("TC_AP_189 - Verify Edit Form And Update User", async ({
  mobileUsersPage,
}) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.createMobileUser(user);

  await test.step("Open edit form for created user", async () => {
    await mobileUsersPage.searchUsers(user.userName);
    await mobileUsersPage.openEditUser(user.userName);
    await mobileUsersPage.expectEditFormLoaded();
    await expect(mobileUsersPage.page.locator("#status")).toBeVisible();
  });

  await test.step("Update last name and save", async () => {
    const newLast = TestDataGenerator.generateRandomLastName();
    await mobileUsersPage.fillCreateUserForm({ lastName: newLast });
    await mobileUsersPage.submitUpdateUser();
    await mobileUsersPage.expectUserSavedSuccess();
  });
});

test("TC_AP_190 - Verify Username Not Editable On Edit", async ({
  mobileUsersPage,
}) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.createMobileUser(user);

  await test.step("Open edit form and verify username is disabled", async () => {
    await mobileUsersPage.searchUsers(user.userName);
    await mobileUsersPage.openEditUser(user.userName);
    await expect(mobileUsersPage.userNameInput()).toBeDisabled();
  });
});

test("TC_AP_194 - Verify Status Field On Edit Form", async ({
  mobileUsersPage,
}) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.createMobileUser(user);

  await test.step("Open edit form and set status to Inactive", async () => {
    await mobileUsersPage.searchUsers(user.userName);
    await mobileUsersPage.openEditUser(user.userName);
    await expect(mobileUsersPage.page.locator("#status")).toBeVisible();
    await mobileUsersPage.selectStatus(false);
    await mobileUsersPage.submitUpdateUser();
    await mobileUsersPage.expectUserSavedSuccess();
  });

  await test.step("Verify status shows Inactive in listing", async () => {
    await mobileUsersPage.searchUsers(user.userName);
    const statuses = await mobileUsersPage.getColumnValues("status");
    expect(statuses[0]).toBe(MobileUsersData.status.inactive);
  });
});

test("TC_AP_195 - Verify HQ Group Not Editable On Edit", async ({
  mobileUsersPage,
}) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.createMobileUser(user);

  await test.step("Open edit form and verify HQ group cannot be removed", async () => {
    await mobileUsersPage.searchUsers(user.userName);
    await mobileUsersPage.openEditUser(user.userName);
    await mobileUsersPage.expectHqGroupAssigned();
    await expect(
      mobileUsersPage.hqGroupChip().locator(".crossIconCss"),
    ).toHaveCount(0);
  });

  await test.step("Save edit form successfully", async () => {
    await mobileUsersPage.submitUpdateUser();
    await mobileUsersPage.expectUserSavedSuccess();
  });
});

test("TC_AP_196 - Verify Role Can Be Changed On Edit", async ({
  mobileUsersPage,
}) => {
  const user = MobileUsersData.buildValidUser({
    roleHqYes: false,
    deleteMsgYes: false,
  });
  await mobileUsersPage.createMobileUser(user);

  await test.step("Update Role HQ and Delete Message on edit form", async () => {
    await mobileUsersPage.searchUsers(user.userName);
    await mobileUsersPage.openEditUser(user.userName);
    await mobileUsersPage.selectRadioByLabel(/Role HQ/i, "Yes");
    await mobileUsersPage.selectRadioByLabel(/Delete Message/i, "Yes");
    await mobileUsersPage.submitUpdateUser();
    await mobileUsersPage.expectUserSavedSuccess();
  });

  await test.step("Verify updated roles in listing", async () => {
    await mobileUsersPage.searchUsers(user.userName);
    expect(await mobileUsersPage.getColumnValues("roleHq")).toContain(
      MobileUsersData.roles.yes,
    );
    expect(await mobileUsersPage.getColumnValues("deleteMsg")).toContain(
      MobileUsersData.roles.yes,
    );
  });
});

test("TC_AP_200 - Verify Listing Columns", async ({ mobileUsersPage }) => {
  await test.step("Verify all expected column headers are visible", async () => {
    for (const col of MobileUsersData.listingColumns) {
      await mobileUsersPage.expectColumnHeaderVisible(col);
    }
  });

  await test.step("Verify edit action is available on listing rows", async () => {
    const user = await mobileUsersPage.getApiListingUser();
    await mobileUsersPage.prepareUserFromApi(user);
    await expect(mobileUsersPage.editIcon(user.userName)).toBeVisible();
  });
});

test("TC_AP_201 - Verify Default Active Status In Listing", async ({
  mobileUsersPage,
}) => {
  const user = MobileUsersData.buildValidUser();

  await test.step("Create a new mobile user", async () => {
    await mobileUsersPage.createMobileUser(user);
  });

  await test.step("Verify Active status in listing", async () => {
    await mobileUsersPage.searchUsers(user.userName);
    expect(await mobileUsersPage.getColumnValues("status")).toContain(
      MobileUsersData.status.active,
    );
  });
});

test("TC_AP_202 - Verify HQ Role Shows Yes In Listing", async ({
  mobileUsersPage,
}) => {
  const user = MobileUsersData.buildValidUser({ roleHqYes: true });

  await test.step("Create user with Role HQ set to Yes", async () => {
    await mobileUsersPage.createMobileUser(user);
  });

  await test.step("Verify Role HQ column shows Yes", async () => {
    await mobileUsersPage.searchUsers(user.userName);
    expect(await mobileUsersPage.getColumnValues("roleHq")).toContain(
      MobileUsersData.roles.yes,
    );
  });
});

test("TC_AP_203 - Verify Delete Role Shows Yes In Listing", async ({
  mobileUsersPage,
}) => {
  const user = MobileUsersData.buildValidUser({ deleteMsgYes: true });

  await test.step("Create user with Delete Message set to Yes", async () => {
    await mobileUsersPage.createMobileUser(user);
  });

  await test.step("Verify Delete Message column shows Yes", async () => {
    await mobileUsersPage.searchUsers(user.userName);
    expect(await mobileUsersPage.getColumnValues("deleteMsg")).toContain(
      MobileUsersData.roles.yes,
    );
  });
});

test("TC_AP_204 - Verify Delete Icon Opens Confirmation", async ({
  mobileUsersPage,
}) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.createMobileUser(user);

  await test.step("Click delete icon and verify confirmation modal", async () => {
    await mobileUsersPage.searchUsers(user.userName);
    await mobileUsersPage.clickDeleteIcon(user.userName);
    await expect(mobileUsersPage.confirmModal()).toContainText(
      MobileUsersData.messages.inactivateConfirm,
    );
  });

  await test.step("Cancel delete action", async () => {
    await mobileUsersPage.confirmModalAction(false);
    await mobileUsersPage.expectUserVisible(user.userName);
  });
});

test("TC_AP_205 - Verify Delete Makes User Inactive", async ({
  mobileUsersPage,
}) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.createMobileUser(user);

  await test.step("Confirm inactivate user from listing", async () => {
    await mobileUsersPage.searchUsers(user.userName);
    await mobileUsersPage.clickDeleteIcon(user.userName);
    await mobileUsersPage.confirmModalAction(true);
  });

  await test.step("Verify user status is Inactive in listing", async () => {
    await mobileUsersPage.searchUsers(user.userName);
    expect(await mobileUsersPage.getColumnValues("status")).toContain(
      MobileUsersData.status.inactive,
    );
  });
});

test("TC_AP_206 - Verify Pagination 25 Per Page", async ({
  mobileUsersPage,
}) => {
  const apiTotal = await mobileUsersPage.getApiMobileUsersCount();
  const pageSize = MobileUsersData.pagination.defaultPageSize;

  await test.step("Verify default page matches API total and page size", async () => {
    const rows = await mobileUsersPage.getVisibleRowCount();
    const uiTotal = await mobileUsersPage.getTotalUserCount();
    expect(uiTotal).toBe(apiTotal);
    expect(rows).toBeLessThanOrEqual(pageSize);
    if (apiTotal > 0) {
      expect(rows).toBe(Math.min(pageSize, apiTotal));
    }
  });

  await test.step("Navigate to next page when available", async () => {
    if (await mobileUsersPage.nextPageButton().isEnabled()) {
      const response = mobileUsersPage.page.waitForResponse((r) =>
        r.url().includes("/user/mobile"),
      );
      await mobileUsersPage.nextPageButton().click();
      await response;
      expect(await mobileUsersPage.getVisibleRowCount()).toBeGreaterThan(0);
    }
  });
});

test("TC_AP_207 - Verify Search Trims Spaces", async ({ mobileUsersPage }) => {
  const user = MobileUsersData.buildValidUser();

  await test.step("Create a mobile user", async () => {
    await mobileUsersPage.createMobileUser(user);
  });

  await test.step("Search with leading and trailing spaces", async () => {
    await mobileUsersPage.searchUsers(`  ${user.userName}  `);
    await mobileUsersPage.expectUserVisible(user.userName);
  });
});

test("TC_AP_208 - Verify Sorting On Listing", async ({ mobileUsersPage }) => {
  const { users } = await mobileUsersPage.fetchMobileUsers();
  expect(
    users.length,
    "Need at least 2 mobile users from API to verify sorting",
  ).toBeGreaterThanOrEqual(2);

  await test.step("Sort Username ascending", async () => {
    await mobileUsersPage.clickSort("Username", "asc");
    const after = await mobileUsersPage.getColumnValues("userName");
    expect(after.length).toBeGreaterThan(0);
    const sorted = [...after].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
    expect(after).toEqual(sorted);
  });

  await test.step("Sort Username descending", async () => {
    await mobileUsersPage.clickSort("Username", "desc");
    const after = await mobileUsersPage.getColumnValues("userName");
    expect(after.length).toBeGreaterThan(0);
    const sorted = [...after].sort((a, b) =>
      b.localeCompare(a, undefined, { sensitivity: "base" }),
    );
    expect(after).toEqual(sorted);
  });
});

/**
 * Bulk upload — listing entry point (Bulk Upload + Create User links).
 *
 * Tester notes (all bulk-upload cases below):
 * - Re-login before runs (auth.setup refreshes JWT each Playwright run).
 * - Do not parallelize (playwright.config defaults to 1 worker / fullyParallel: false).
 * - Ideally run TC_AP_268 alone when possible (large 1000-record upload; long timeout).
 */
test("TC_AP_209 - Verify Bulk Upload And Create Buttons", async ({
  mobileUsersPage,
}) => {
  await test.step("Verify Bulk Upload and Create User links are visible", async () => {
    await expect(mobileUsersPage.bulkUploadLink()).toBeVisible();
    await expect(mobileUsersPage.createUserLink()).toBeVisible();
  });

  await test.step("Navigate to bulk upload page", async () => {
    await mobileUsersPage.bulkUploadLink().click();
    await expect(mobileUsersPage.page).toHaveURL(/bulk-upload/);
  });
});

test("TC_AP_210 - Verify Groups Filter", async ({ mobileUsersPage }) => {
  const group = await mobileUsersPage.getApiNonHqGroupWithMembers();

  await test.step("Apply Groups filter", async () => {
    await mobileUsersPage.openFilterModal();
    await mobileUsersPage.selectFilterTab("Groups");
    await mobileUsersPage.toggleFilterCheckbox(group.name);
    await mobileUsersPage.applyFilter();
  });

  await test.step("Verify filtered listing has results", async () => {
    const filtered = await mobileUsersPage.fetchMobileUsers({
      filters: { userGroups: [group.code] },
    });
    const rows = await mobileUsersPage.getVisibleRowCount();
    expect(rows).toBeGreaterThan(0);
    expect(rows).toBeLessThanOrEqual(filtered.total);
  });
});

test("TC_AP_213 - Verify Filter Select All Groups", async ({
  mobileUsersPage,
}) => {
  await test.step("Select all groups and apply filter", async () => {
    await mobileUsersPage.openFilterModal();
    await mobileUsersPage.selectFilterTab("Groups");
    await mobileUsersPage.clickFilterSelectAll();
    await mobileUsersPage.applyFilter();
  });

  await test.step("Verify filtered listing has results", async () => {
    const apiTotal = await mobileUsersPage.getApiMobileUsersCount();
    const rows = await mobileUsersPage.getVisibleRowCount();
    expect(rows).toBeGreaterThan(0);
    expect(rows).toBeLessThanOrEqual(apiTotal);
  });
});

test("TC_AP_214 - Verify Filter Select All Roles", async ({
  mobileUsersPage,
}) => {
  await test.step("Select all roles and apply filter", async () => {
    await mobileUsersPage.openFilterModal();
    await mobileUsersPage.selectFilterTab("Roles");
    await mobileUsersPage.clickFilterSelectAll();
    await mobileUsersPage.applyFilter();
  });

  await test.step("Verify filtered listing has results", async () => {
    const apiTotal = await mobileUsersPage.getApiMobileUsersCount();
    const rows = await mobileUsersPage.getVisibleRowCount();
    expect(rows).toBeGreaterThan(0);
    expect(rows).toBeLessThanOrEqual(apiTotal);
  });
});

test("TC_AP_215 - Verify Filter Clear All", async ({ mobileUsersPage }) => {
  await test.step("Select all groups then clear all filters", async () => {
    await mobileUsersPage.openFilterModal();
    await mobileUsersPage.selectFilterTab("Groups");
    await mobileUsersPage.clickFilterSelectAll();
    await mobileUsersPage.clickFilterClearAll();
    await mobileUsersPage.applyFilter();
  });

  await test.step("Verify listing still shows results", async () => {
    const apiTotal = await mobileUsersPage.getApiMobileUsersCount();
    const rows = await mobileUsersPage.getVisibleRowCount();
    expect(rows).toBeGreaterThan(0);
    expect(rows).toBeLessThanOrEqual(apiTotal);
  });
});

test("TC_AP_216 - Verify Password Field On Create Form", async ({
  mobileUsersPage,
}) => {
  await test.step("Open create form and verify password field is visible", async () => {
    await mobileUsersPage.clickCreateUser();
    await mobileUsersPage.expectPasswordFieldVisible(true);
  });
});

test("TC_AP_217 - Verify Password Mask Unmask", async ({ mobileUsersPage }) => {
  await test.step("Fill password and verify masked by default", async () => {
    await mobileUsersPage.clickCreateUser();
    await mobileUsersPage.fillCreateUserForm({
      password: TestDataGenerator.generateValidPassword(),
    });
    await mobileUsersPage.expectPasswordMasked();
  });

  await test.step("Toggle visibility and verify password is unmasked", async () => {
    await mobileUsersPage.togglePasswordVisibility();
    await mobileUsersPage.expectPasswordUnmasked();
  });
});

test("TC_AP_219 - Verify Password Not On Update Form", async ({
  mobileUsersPage,
}) => {
  const user = MobileUsersData.buildValidUser();
  await mobileUsersPage.createMobileUser(user);

  await test.step("Open edit form and verify password field is absent", async () => {
    await mobileUsersPage.searchUsers(user.userName);
    await mobileUsersPage.openEditUser(user.userName);
    await mobileUsersPage.expectPasswordFieldVisible(false);
  });
});

test("TC_AP_220 - Verify Password Maximum Length 15", async ({
  mobileUsersPage,
}) => {
  const password = "Tt@123456789012".slice(
    0,
    MobileUsersData.limits.passwordMax,
  );
  const user = MobileUsersData.buildValidUser({ password });

  await test.step("Create user with 15-character password", async () => {
    await mobileUsersPage.createMobileUser(user);
  });
});

test("TC_AP_221 - Verify Password Over 15 Not Accepted", async ({
  mobileUsersPage,
}) => {
  await test.step("Enter a password over 15 characters", async () => {
    await mobileUsersPage.clickCreateUser();
    await mobileUsersPage.fillCreateUserForm({
      ...MobileUsersData.buildValidUser(),
      password: `${TestDataGenerator.generateLongString(16)}Aa1!`,
    });
  });

  await test.step("Verify the field enforces the 15-character boundary", async () => {
    expect((await mobileUsersPage.passwordInput().inputValue()).length).toBe(
      MobileUsersData.limits.passwordMax,
    );
    await expect(mobileUsersPage.page).toHaveURL(
      new RegExp(MobileUsersData.paths.create),
    );
  });
});

/**
 * TC_AP_273 — Bulk upload: CSV fields/rules match documented steps; template headers.
 * Recommended bulk-upload order: 3 — CSV field rules from TC_AP_273 manual steps.
 * Tester notes: re-login before runs; do not parallelize.
 */
test("TC_AP_273 - Verify CSV File Consists Of Fields Defined In Steps", async ({
  mobileUsersPage,
}) => {
  await test.step("Open bulk upload page", async () => {
    await mobileUsersPage.openBulkUploadFromListing();
  });

  await test.step("Verify TC_AP_273 field and validation rules are documented on the page", async () => {
    await mobileUsersPage.expectBulkUploadFieldRulesVisible();
    await mobileUsersPage.expectBulkUploadRuleVisible(
      /Only \.csv file format is supported/i,
    );
    await mobileUsersPage.expectBulkUploadRuleVisible(
      /Maximum records should be 30000/i,
    );
    await mobileUsersPage.expectBulkUploadRuleVisible(/eng or thai or jpn/i);
    await mobileUsersPage.expectBulkUploadRuleVisible(
      /maximum 10 alphanumeric characters/i,
    );
  });

  await test.step("Verify downloaded template contains required CSV headers", async () => {
    const download = await mobileUsersPage.downloadBulkTemplate();
    const downloadPath = path.join(
      os.tmpdir(),
      `tc273-${download.suggestedFilename()}`,
    );
    await download.saveAs(downloadPath);

    const raw = fs.readFileSync(downloadPath);
    const content = raw.includes(0x00)
      ? raw.toString("utf16le").replace(/^\uFEFF/, "")
      : raw.toString("utf8");
    const headerLine = content.split(/\r?\n/)[0] ?? "";

    for (const column of BulkUploadCsvBuilder.specHeaders) {
      expect(headerLine).toContain(column);
    }

    expect(headerLine).toContain("Password");
  });
});

/**
 * TC_AP_274 — Bulk upload: rules section visible as expected.
 * Recommended bulk-upload order: 1 — rules baseline before file operations.
 * Tester notes: re-login before runs; do not parallelize.
 */
test("TC_AP_274 - Verify Bulk Upload Rules Are Given As Expected", async ({
  mobileUsersPage,
}) => {
  await test.step("Open bulk upload page", async () => {
    await mobileUsersPage.openBulkUploadFromListing();
  });

  await test.step("Verify rules section and documented upload rules are visible", async () => {
    await mobileUsersPage.expectBulkUploadRulesVisible();
    await mobileUsersPage.expectBulkUploadRuleVisible(
      "Please follow below rules while uploading the document",
    );
  });
});

/**
 * TC_AP_275 — Bulk upload: template download (filename + headers).
 * Recommended bulk-upload order: 2 — template download before CSV validation tests.
 * Tester notes: re-login before runs; do not parallelize.
 */
test("TC_AP_275 - Verify Bulk Upload Template Can Be Downloaded", async ({
  mobileUsersPage,
}) => {
  let downloadPath = "";

  await test.step("Open bulk upload page", async () => {
    await mobileUsersPage.openBulkUploadFromListing();
  });

  await test.step("Download template and verify file name and headers", async () => {
    const download = await mobileUsersPage.downloadBulkTemplate();
    expect(download.suggestedFilename()).toBe(
      MobileUsersData.bulkUpload.templateFileName,
    );

    downloadPath = path.join(os.tmpdir(), download.suggestedFilename());
    await download.saveAs(downloadPath);

    const raw = fs.readFileSync(downloadPath);
    const content = raw.includes(0x00)
      ? raw.toString("utf16le").replace(/^\uFEFF/, "")
      : raw.toString("utf8");
    const headerLine = content.split(/\r?\n/)[0] ?? "";

    for (const column of BulkUploadCsvBuilder.templateHeaders) {
      expect(headerLine).toContain(column);
    }
  });
});

/**
 * TC_AP_276 — Bulk upload: open History tab from bulk upload page.
 * Recommended bulk-upload order: 8 — history navigation.
 * Tester notes: re-login before runs; do not parallelize.
 */
test("TC_AP_276 - Verify Bulk Upload History Tab Can Be Opened", async ({
  mobileUsersPage,
}) => {
  await test.step("Open bulk upload page", async () => {
    await mobileUsersPage.openBulkUploadFromListing();
  });

  await test.step("Open history tab from bulk upload page", async () => {
    await mobileUsersPage.openBulkUploadHistoryFromPage();
    await expect(mobileUsersPage.page).toHaveURL(/bulk-upload-history/);
  });
});
