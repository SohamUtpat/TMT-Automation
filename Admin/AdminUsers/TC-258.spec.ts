import { test, expect } from "../fixtures/admin-users.fixture";
import { AdminUsersData } from "../data/AdminUsersData";
import { randomBytes } from "crypto";

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
