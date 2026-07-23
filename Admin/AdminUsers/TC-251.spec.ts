import { test } from "../fixtures/admin-users.fixture";

test("TC251 - Verify Profile Photo After Admin Login", async () => {
  test.skip(
    true,
    "New admins receive credentials externally; the suite cannot establish their independent login session.",
  );
});
