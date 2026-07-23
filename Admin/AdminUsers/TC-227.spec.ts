import { test } from "../fixtures/admin-users.fixture";

test("TC_AP_227 - Admin User Cannot Login To Mobile App", async () => {
  test.skip(
    true,
    "Requires a mobile application endpoint/session, which is unavailable to the admin-portal suite.",
  );
});
