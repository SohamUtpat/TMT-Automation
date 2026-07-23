import { test } from "../fixtures/admin-users.fixture";

test("TC_AP_233 - Superadmin Reactivates All Inactive Admins", async () => {
  test.skip(
    true,
    "Requires a superadmin account and would mutate shared inactive users; neither is safe in this environment.",
  );
});
