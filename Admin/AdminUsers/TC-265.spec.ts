import { test, expect } from "../fixtures/admin-users.fixture";

test("TC_AP_265 - Verify Sort Can Be Undone", async ({ adminUsersPage }) => {
  const { total } = await adminUsersPage.fetchAdminUsers();
  test.skip(
    total < 2,
    "Need at least 2 admin users from API to verify sort undo",
  );

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
