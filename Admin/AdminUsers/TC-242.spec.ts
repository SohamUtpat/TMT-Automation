import { test } from "../fixtures/admin-users.fixture";

test("TC_AP_242 - Verify Doraku Failure Notification", async () => {
  test.skip(
    true,
    "Requires Doraku integration to be enabled and a controllable provider failure trigger.",
  );
});
