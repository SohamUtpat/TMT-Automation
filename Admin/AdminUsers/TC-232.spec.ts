import { test, expect } from "../fixtures/admin-users.fixture";

test("TC_AP_232 - Verify User Cannot Make Themselves Inactive", async ({
  adminUsersPage,
}) => {
  const loggedIn = await adminUsersPage.getLoggedInAdmin();
  await adminUsersPage.searchUsers(loggedIn.userName);

  await expect(adminUsersPage.userRow(loggedIn.userName)).toHaveCount(0);
  await expect(adminUsersPage.editIcon(loggedIn.userName)).toHaveCount(0);
  await expect(adminUsersPage.deleteIcon(loggedIn.userName)).toHaveCount(0);
});
