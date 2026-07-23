import { test, expect } from "../fixtures/admin-users.fixture";
import { AdminUsersData } from "../data/AdminUsersData";

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
