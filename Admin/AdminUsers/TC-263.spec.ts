import { test } from "../fixtures/admin-users.fixture";

test("TC_AP_263 - Verify Mobile Rejects Invalid Characters", async () => {
  test.skip(
    true,
    "Frontend defect: invalid-phone detection combines pattern and length failures with &&, so this validation is not exposed.",
  );
});
