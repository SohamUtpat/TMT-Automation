import { test, expect } from "../fixtures/admin-users.fixture";
import { AdminUsersData } from "../data/AdminUsersData";

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
