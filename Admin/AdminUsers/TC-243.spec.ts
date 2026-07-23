import { test, expect } from "../fixtures/admin-users.fixture";
import { AdminUsersData } from "../data/AdminUsersData";

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
