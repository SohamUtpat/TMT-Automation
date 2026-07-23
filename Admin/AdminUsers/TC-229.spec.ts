import { test } from "../fixtures/admin-users.fixture";

test("TC_AP_229 - Verify Created User Receives Email", async () => {
  test.skip(
    true,
    "Requires access to the created user mailbox or email provider, which is not configured.",
  );
});
