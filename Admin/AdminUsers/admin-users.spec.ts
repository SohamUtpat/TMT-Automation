import { test, expect } from "../fixtures/admin-users.fixture";
import { AdminUsersData } from "../data/AdminUsersData";
import { TestDataGenerator } from "../utils/TestDataGenerator";
import { randomBytes } from "crypto";

test.describe("TC_AP_222 - Create Admin User Form Fields", () => {
  test("Verify create admin user form has required fields", async ({
    adminUsersPage,
  }) => {
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
      .locator(".admin-radio-lables, .admin-radio-labels")
      .filter({ hasText: /Doraku/i })
      .isVisible()
      .catch(() => false);
    if (dorakuVisible) {
      await adminUsersPage.expectFormFieldVisible(/Doraku/i);
    }

    await adminUsersPage.cancelButton().click();
    await adminUsersPage.expectListingLoaded();
  });
});

test("TC_AP_223 - Verify Text Fields Trim Spaces", async ({
  adminUsersPage,
}) => {
  const user = AdminUsersData.buildValidUser();

  await adminUsersPage.clickCreateUser();
  await adminUsersPage.fillCreateUserForm({
    ...user,
    firstName: `  ${user.firstName}  `,
    lastName: `  ${user.lastName}  `,
    userName: `  ${user.userName}  `,
    email: `  ${user.email}  `,
  });
  await adminUsersPage.submitCreateUser();

  await adminUsersPage.searchUsers(user.userName);
  await adminUsersPage.expectUserVisible(user.userName);
});

test("TC_AP_224 - Verify Required Fields Except Mobile And Profile Pic", async ({
  adminUsersPage,
}) => {
  const user = AdminUsersData.buildValidUser({ phone: "" });

  await adminUsersPage.clickCreateUser();
  await adminUsersPage.fillCreateUserForm(user);
  await adminUsersPage.submitCreateUser();
  await adminUsersPage.searchUsers(user.userName);
  await adminUsersPage.expectUserVisible(user.userName);

  await adminUsersPage.clickCreateUser();
  await adminUsersPage.fillCreateUserForm({
    firstName: "",
    lastName: "",
    userName: "",
    email: "",
  });
  await adminUsersPage.submitCreateUser({ waitForApi: false });
  await adminUsersPage.expectValidationMessage(
    AdminUsersData.validation.required,
  );
  await expect(adminUsersPage.firstNameInput()).toBeVisible();
});

test("TC_AP_225 - Verify Create And Cancel Buttons", async ({
  adminUsersPage,
}) => {
  await adminUsersPage.clickCreateUser();
  await expect(adminUsersPage.submitButton()).toBeVisible();
  await expect(adminUsersPage.cancelButton()).toBeVisible();
  await adminUsersPage.cancelForm();
});

test("TC_AP_226 - Verify Default Language From Settings", async ({
  adminUsersPage,
}) => {
  await adminUsersPage.clickCreateUser();
  const checked = adminUsersPage.page.locator(
    '.language-class input[type="radio"]:checked',
  );
  await expect(checked).toBeVisible();
  const label = await checked.locator("xpath=ancestor::label").textContent();
  expect(label?.trim().length).toBeGreaterThan(0);
  await adminUsersPage.cancelForm();
});

test("TC_AP_228 - Verify Created User Appears In Listing", async ({
  adminUsersPage,
}) => {
  const user = AdminUsersData.buildValidUser();
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.searchUsers(user.userName);
  await adminUsersPage.expectUserVisible(user.userName);

  const apiUser = (
    await adminUsersPage.fetchAdminUsers({ search: user.userName })
  ).users[0];
  expect(apiUser?.userName).toBe(user.userName);
});

test("TC_AP_230 - Verify Default Status Active On Create", async ({
  adminUsersPage,
}) => {
  const user = AdminUsersData.buildValidUser();
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.searchUsers(user.userName);

  const statuses = await adminUsersPage.getColumnValues("status");
  expect(statuses[0]).toBe(AdminUsersData.status.active);

  const apiUser = (
    await adminUsersPage.fetchAdminUsers({ search: user.userName })
  ).users[0];
  expect(apiUser?.status).toBe("1");
});

test("TC_AP_231 - Verify Inactive User Status On Listing", async ({
  adminUsersPage,
}) => {
  const user = AdminUsersData.buildValidUser();
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.openEditUser(user.userName!);
  await adminUsersPage.selectStatus(false);
  await adminUsersPage.submitUpdateUser();
  await adminUsersPage.expectListingLoaded();

  await adminUsersPage.searchUsers(user.userName!);
  const statuses = await adminUsersPage.getColumnValues("status");
  expect(statuses[0]).toBe(AdminUsersData.status.inactive);
});

test("TC_AP_232 - Verify User Cannot Make Themselves Inactive", async ({
  adminUsersPage,
}) => {
  const loggedIn = await adminUsersPage.getLoggedInAdmin();
  await adminUsersPage.searchUsers(loggedIn.userName);

  await expect(adminUsersPage.userRow(loggedIn.userName)).toHaveCount(0);
  await expect(adminUsersPage.editIcon(loggedIn.userName)).toHaveCount(0);
  await expect(adminUsersPage.deleteIcon(loggedIn.userName)).toHaveCount(0);
});

test("TC_AP_234 - Verify Edit Form Matches Create Form Fields", async ({
  adminUsersPage,
}) => {
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
});

test("TC_AP_235 - Verify Status Can Be Changed On Edit", async ({
  adminUsersPage,
}) => {
  const user = AdminUsersData.buildValidUser();
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.openEditUser(user.userName!);
  await expect(adminUsersPage.statusRadioGroup()).toBeVisible();
  await adminUsersPage.selectStatus(false);
  await adminUsersPage.submitUpdateUser();
  await adminUsersPage.expectUserSavedSuccess();
});

test("TC_AP_236 - Verify Inactive Status After Edit", async ({
  adminUsersPage,
}) => {
  const user = AdminUsersData.buildValidUser();
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.openEditUser(user.userName!);
  await adminUsersPage.selectStatus(false);
  await adminUsersPage.submitUpdateUser();
  await adminUsersPage.searchUsers(user.userName!);
  const statuses = await adminUsersPage.getColumnValues("status");
  expect(statuses[0]).toBe(AdminUsersData.status.inactive);
});

test("TC_AP_237 - Verify Edit Form Has Update And Cancel Buttons", async ({
  adminUsersPage,
}) => {
  const apiUser = await adminUsersPage.getApiListingUser();
  await adminUsersPage.openEditUser(apiUser.userName);
  await expect(adminUsersPage.submitButton()).toBeVisible();
  await expect(adminUsersPage.cancelButton()).toBeVisible();
  await adminUsersPage.cancelForm();
});

test("TC_AP_238 - Verify User Details Can Be Edited And Updated", async ({
  adminUsersPage,
}) => {
  const user = AdminUsersData.buildValidUser();
  await adminUsersPage.createAdminUser(user);

  const updatedFirst = TestDataGenerator.generateRandomName();
  await adminUsersPage.openEditUser(user.userName!);
  await adminUsersPage.fillCreateUserForm({ firstName: updatedFirst });
  await adminUsersPage.submitUpdateUser();
  await adminUsersPage.expectUserSavedSuccess();

  await adminUsersPage.searchUsers(user.userName!);
  const names = await adminUsersPage.getColumnValues("name");
  expect(names[0]).toContain(updatedFirst);
});

test("TC_AP_239 - Verify User Saved Successfully Message On Update", async ({
  adminUsersPage,
}) => {
  const apiUser = await adminUsersPage.getApiListingUser();
  await adminUsersPage.openEditUser(apiUser.userName);
  await adminUsersPage.fillCreateUserForm({
    firstName: TestDataGenerator.generateRandomName(),
  });
  await adminUsersPage.submitUpdateUser();
  await expect(
    adminUsersPage.toast(AdminUsersData.messages.userSaved),
  ).toBeVisible();
});

test("TC_AP_240 - Verify Update Without Mobile And Profile Pic", async ({
  adminUsersPage,
}) => {
  const user = AdminUsersData.buildValidUser({ phone: "" });
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.openEditUser(user.userName!);
  await adminUsersPage.fillCreateUserForm({
    lastName: TestDataGenerator.generateRandomLastName(),
    phone: "",
  });
  await adminUsersPage.submitUpdateUser();
  await adminUsersPage.expectUserSavedSuccess();
});

test("TC_AP_241 - Verify Admin Listing Columns And Data", async ({
  adminUsersPage,
}) => {
  for (const col of AdminUsersData.listingColumns) {
    await adminUsersPage.expectColumnHeaderVisible(col);
  }

  const apiUser = await adminUsersPage.getApiListingUser();
  await adminUsersPage.prepareUserFromApi(apiUser);

  const userNames = await adminUsersPage.getColumnValues("userName");
  expect(userNames).toContain(apiUser.userName);

  const emails = await adminUsersPage.getColumnValues("email");
  expect(
    emails.some((email) => email.includes(apiUser.email.split("@")[0])),
  ).toBe(true);
});

test("TC_AP_243 - Verify Active User Can Be Inactivated", async ({
  adminUsersPage,
}) => {
  const user = AdminUsersData.buildValidUser();
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.searchUsers(user.userName!);

  await adminUsersPage.clickDeleteIcon(user.userName!);
  await expect(adminUsersPage.confirmModal()).toContainText(
    AdminUsersData.messages.inactivateConfirm,
  );
  await adminUsersPage.confirmModalAction(true);
  await expect(
    adminUsersPage.toast(AdminUsersData.messages.userInactivated),
  ).toBeVisible({
    timeout: 30_000,
  });

  await adminUsersPage.searchUsers(user.userName!);
  const statuses = await adminUsersPage.getColumnValues("status");
  expect(statuses[0]).toBe(AdminUsersData.status.inactive);
});

test("TC_AP_244 - Verify Status Visible On Listing After Update", async ({
  adminUsersPage,
}) => {
  const user = AdminUsersData.buildValidUser();
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.searchUsers(user.userName!);
  let statuses = await adminUsersPage.getColumnValues("status");
  expect(statuses[0]).toBe(AdminUsersData.status.active);

  await adminUsersPage.openEditUser(user.userName!);
  await adminUsersPage.selectStatus(false);
  await adminUsersPage.submitUpdateUser();
  await adminUsersPage.searchUsers(user.userName!);
  statuses = await adminUsersPage.getColumnValues("status");
  expect(statuses[0]).toBe(AdminUsersData.status.inactive);
});

test("TC_AP_245 - Verify Edit Icon Opens Update Form", async ({
  adminUsersPage,
}) => {
  const apiUser = await adminUsersPage.getApiListingUser();
  await adminUsersPage.openEditUser(apiUser.userName);
  await adminUsersPage.expectEditFormLoaded();
  await adminUsersPage.cancelForm();
});

test("TC_AP_246 - Verify Pagination Shows 25 Users Per Page", async ({
  adminUsersPage,
}) => {
  const apiTotal = await adminUsersPage.getApiAdminUsersCount();
  const visibleRows = await adminUsersPage.getVisibleRowCount();
  expect(visibleRows).toBeLessThanOrEqual(
    AdminUsersData.pagination.defaultPageSize,
  );
  if (apiTotal > AdminUsersData.pagination.defaultPageSize) {
    expect(visibleRows).toBe(AdminUsersData.pagination.defaultPageSize);
    await expect(adminUsersPage.nextPageButton()).toBeEnabled();
    await adminUsersPage.goToNextPage();
    expect(await adminUsersPage.getVisibleRowCount()).toBeGreaterThan(0);
    await adminUsersPage.goToFirstPage();
  }
});

test("TC_AP_247 - Verify Search Trims Leading And Trailing Spaces", async ({
  adminUsersPage,
}) => {
  const apiUser = await adminUsersPage.getApiListingUser();
  await adminUsersPage.searchUsers(`  ${apiUser.userName}  `);
  await adminUsersPage.expectUserVisible(apiUser.userName);
  const userNames = await adminUsersPage.getColumnValues("userName");
  expect(
    userNames.every(
      (name) => name.includes(apiUser.userName) || name === apiUser.userName,
    ),
  ).toBe(true);
});

test("TC_AP_248 - Verify Usernames Are Unique", async ({ adminUsersPage }) => {
  const user = AdminUsersData.buildValidUser();
  await adminUsersPage.createAdminUser(user);

  await adminUsersPage.clickCreateUser();
  await adminUsersPage.fillCreateUserForm({
    ...AdminUsersData.buildValidUser(),
    userName: user.userName,
  });
  const duplicateResponsePromise = adminUsersPage.page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      /\/user-management-service\/user(?:\?|$)/.test(response.url()),
  );
  await adminUsersPage.submitCreateUser({ waitForApi: false });
  const duplicateResponse = await duplicateResponsePromise;
  expect(await duplicateResponse.text()).toMatch(
    /user.*(?:already|exist|duplicate)|(?:already|exist|duplicate).*user/i,
  );
  await expect(adminUsersPage.page).toHaveURL(
    new RegExp(`${AdminUsersData.paths.create}$`),
  );
});

test("TC_AP_250 - Verify Profile Photo Format Validation", async ({
  adminUsersPage,
}) => {
  await adminUsersPage.clickCreateUser();
  await adminUsersPage.uploadProfilePhoto(AdminUsersData.testAssets.invalidPdf);
  await adminUsersPage.expectUploadError(
    AdminUsersData.validation.invalidImageFormat,
  );
  await adminUsersPage.cancelForm();
});

test("TC_AP_252 - Verify First Name Maximum Length 50", async ({
  adminUsersPage,
}) => {
  const user = AdminUsersData.buildValidUser({
    firstName: TestDataGenerator.generateLongString(50),
  });
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.searchUsers(user.userName!);
  await adminUsersPage.expectUserVisible(user.userName!);
});

test("TC_AP_253 - Verify First Name Over 50 Shows Validation", async ({
  adminUsersPage,
}) => {
  await adminUsersPage.clickCreateUser();
  await adminUsersPage.fillCreateUserForm({
    ...AdminUsersData.buildValidUser(),
    firstName: TestDataGenerator.generateLongString(51),
  });
  await adminUsersPage.submitCreateUser({ waitForApi: false });
  await adminUsersPage.expectValidationMessage(
    AdminUsersData.validation.firstNameMaxLength,
  );
});

test("TC_AP_254 - Verify Last Name Maximum Length 50", async ({
  adminUsersPage,
}) => {
  const user = AdminUsersData.buildValidUser({
    lastName: TestDataGenerator.generateLongString(50),
  });
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.searchUsers(user.userName!);
  await adminUsersPage.expectUserVisible(user.userName!);
});

test("TC_AP_255 - Verify Last Name Over 50 Shows Validation", async ({
  adminUsersPage,
}) => {
  await adminUsersPage.clickCreateUser();
  await adminUsersPage.fillCreateUserForm({
    ...AdminUsersData.buildValidUser(),
    lastName: TestDataGenerator.generateLongString(51),
  });
  await adminUsersPage.submitCreateUser({ waitForApi: false });
  await adminUsersPage.expectValidationMessage(
    AdminUsersData.validation.lastNameMaxLength,
  );
});

test("TC_AP_256 - Verify No Minimum Length For Name Fields", async ({
  adminUsersPage,
}) => {
  const user = AdminUsersData.buildValidUser({
    firstName: "A",
    lastName: "B",
  });
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.searchUsers(user.userName!);
  await adminUsersPage.expectUserVisible(user.userName!);
});

test("TC_AP_257 - Verify Username Boundary Length 49", async ({
  adminUsersPage,
}) => {
  const uniquePrefix = AdminUsersData.buildValidUser().userName;
  const user = AdminUsersData.buildValidUser({
    userName: `${uniquePrefix}${"A".repeat(49)}`.slice(0, 49),
  });
  expect(user.userName).toHaveLength(49);
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.searchUsers(user.userName!);
  await adminUsersPage.expectUserVisible(user.userName!);
});

test("TC_AP_258 - Verify Username Minimum Length 3", async ({
  adminUsersPage,
}) => {
  let userName = "";
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = `u${randomBytes(2).toString("base64url").slice(0, 2)}`;
    if (
      (await adminUsersPage.fetchAdminUsers({ search: candidate })).users
        .length === 0
    ) {
      userName = candidate;
      break;
    }
  }
  expect(userName).toHaveLength(3);

  const user = AdminUsersData.buildValidUser({
    userName,
  });
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.searchUsers(user.userName!);
  await adminUsersPage.expectUserVisible(user.userName!);
});

test("TC_AP_259 - Verify Username Over 50 Shows Validation", async ({
  adminUsersPage,
}) => {
  await adminUsersPage.clickCreateUser();
  await adminUsersPage.fillCreateUserForm({
    ...AdminUsersData.buildValidUser(),
    userName: TestDataGenerator.generateLongString(51),
  });
  await adminUsersPage.submitCreateUser({ waitForApi: false });
  await adminUsersPage.expectValidationMessage(
    AdminUsersData.validation.usernameLength,
  );
});

test("TC_AP_260 - Verify Username Under 3 Shows Validation", async ({
  adminUsersPage,
}) => {
  await adminUsersPage.clickCreateUser();
  await adminUsersPage.fillCreateUserForm({
    ...AdminUsersData.buildValidUser(),
    userName: "ab",
  });
  await adminUsersPage.submitCreateUser({ waitForApi: false });
  await adminUsersPage.expectValidationMessage(
    AdminUsersData.validation.usernameLength,
  );
});

test("TC_AP_261 - Verify Valid JP/SG/TH Mobile Number Is Accepted", async ({
  adminUsersPage,
}) => {
  const user = AdminUsersData.buildValidUser({
    phone: AdminUsersData.validation.validMobileExample,
  });
  await adminUsersPage.createAdminUser(user);
  await adminUsersPage.searchUsers(user.userName!);
  await adminUsersPage.expectUserVisible(user.userName!);
});

test("TC_AP_264 - Verify Listing Sort By Username Name Created On", async ({
  adminUsersPage,
}) => {
  const { total } = await adminUsersPage.fetchAdminUsers();
  expect(
    total,
    "Need at least 2 admin users from API to verify sorting",
  ).toBeGreaterThanOrEqual(2);

  const verifyTextSort = async (
    header: string,
    column: "userName" | "name",
  ) => {
    await adminUsersPage.clickSort(header, "asc");
    const ascending = await adminUsersPage.getColumnValues(column);
    expect(ascending).toEqual(
      [...ascending].sort((left, right) =>
        left.localeCompare(right, undefined, { sensitivity: "base" }),
      ),
    );

    await adminUsersPage.clickSort(header, "desc");
    const descending = await adminUsersPage.getColumnValues(column);
    expect(descending).toEqual(
      [...descending].sort((left, right) =>
        right.localeCompare(left, undefined, { sensitivity: "base" }),
      ),
    );
    await adminUsersPage.clearSort(header, "desc");
  };

  await verifyTextSort("Username", "userName");
  await verifyTextSort("Name", "name");

  // Listing dates use en-GB DD/MM/YYYY; Date.parse treats slash dates as MM/DD/YYYY.
  const parseListingDate = (value: string): number => {
    const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return Number.NaN;
    return new Date(
      Number(match[3]),
      Number(match[2]) - 1,
      Number(match[1]),
    ).getTime();
  };

  await adminUsersPage.clickSort("Created On", "asc");
  const ascendingDates = await adminUsersPage.getColumnValues("createdOn");
  const ascendingTimes = ascendingDates.map(parseListingDate);
  expect(ascendingTimes.every(Number.isFinite)).toBe(true);
  expect(ascendingTimes).toEqual(
    [...ascendingTimes].sort((left, right) => left - right),
  );

  await adminUsersPage.clickSort("Created On", "desc");
  const descendingTimes = (
    await adminUsersPage.getColumnValues("createdOn")
  ).map(parseListingDate);
  expect(descendingTimes.every(Number.isFinite)).toBe(true);
  expect(descendingTimes).toEqual(
    [...descendingTimes].sort((left, right) => right - left),
  );
});

test("TC_AP_265 - Verify Sort Can Be Undone", async ({ adminUsersPage }) => {
  const { total } = await adminUsersPage.fetchAdminUsers();
  expect(
    total,
    "Need at least 2 admin users from API to verify sort undo",
  ).toBeGreaterThanOrEqual(2);

  const original = await adminUsersPage.getColumnValues("userName");
  await adminUsersPage.clickSort("Username", "asc");
  const sorted = await adminUsersPage.getColumnValues("userName");
  expect(sorted).toEqual(
    [...sorted].sort((left, right) =>
      left.localeCompare(right, undefined, { sensitivity: "base" }),
    ),
  );

  await adminUsersPage.clearSort("Username", "asc");
  const restored = await adminUsersPage.getColumnValues("userName");
  expect(restored).toEqual(original);
});
