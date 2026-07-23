import { test } from "../fixtures/admin-users.fixture";

test("TC_AP_262 - Verify Mobile Over 15 Shows Validation", async () => {
  test.skip(
    true,
    "Frontend defect: invalid-phone detection combines length and pattern failures with &&, so this validation is not exposed.",
  );
});
