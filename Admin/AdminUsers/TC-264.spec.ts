import { test, expect } from "../fixtures/admin-users.fixture";

test("TC_AP_264 - Verify Listing Sort By Username Name Created On", async ({
  adminUsersPage,
}) => {
  const { total } = await adminUsersPage.fetchAdminUsers();
  test.skip(
    total < 2,
    "Need at least 2 admin users from API to verify sorting",
  );

  const verifyTextSort = async (
    header: string,
    column: "userName" | "name",
  ) => {
    await adminUsersPage.clickSort(header, "asc");
    const ascending = await adminUsersPage.getColumnValues(column);
    expect(ascending).toEqual(
      [...ascending].sort((left, right) =>
        left.localeCompare(right, undefined, { sensitivity: "base" }),
      ),
    );

    await adminUsersPage.clickSort(header, "desc");
    const descending = await adminUsersPage.getColumnValues(column);
    expect(descending).toEqual(
      [...descending].sort((left, right) =>
        right.localeCompare(left, undefined, { sensitivity: "base" }),
      ),
    );
    await adminUsersPage.clearSort(header, "desc");
  };

  await verifyTextSort("Username", "userName");
  await verifyTextSort("Name", "name");

  await adminUsersPage.clickSort("Created On", "asc");
  const ascendingDates = await adminUsersPage.getColumnValues("createdOn");
  const ascendingTimes = ascendingDates.map((value) => Date.parse(value));
  expect(ascendingTimes.every(Number.isFinite)).toBe(true);
  expect(ascendingTimes).toEqual(
    [...ascendingTimes].sort((left, right) => left - right),
  );

  await adminUsersPage.clickSort("Created On", "desc");
  const descendingTimes = (
    await adminUsersPage.getColumnValues("createdOn")
  ).map((value) => Date.parse(value));
  expect(descendingTimes).toEqual(
    [...descendingTimes].sort((left, right) => right - left),
  );
});
