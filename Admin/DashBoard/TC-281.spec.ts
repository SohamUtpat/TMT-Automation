import { test, expect } from '../fixtures/dashboard.fixture';

test('TC_AP_281 - Verify Dashboard Counts Match Actual Data', async ({ dashboardPage }) => {
  const [apiMobileUsers, apiGroups, apiAdmins] = await Promise.all([
    dashboardPage.getApiMobileUsersCount(),
    dashboardPage.getApiGroupsCount(),
    dashboardPage.getApiAdminsCount(),
  ]);

  expect(await dashboardPage.getTopBoxCount('Mobile App Users')).toBe(apiMobileUsers);
  expect(await dashboardPage.getTopBoxCount('Total Groups')).toBe(apiGroups);
  expect(await dashboardPage.getTopBoxCount('Admins')).toBe(apiAdmins);

  // HQ Members and Users Can Delete — commented out until dedicated filter APIs are mapped.
  // expect(await dashboardPage.getTopBoxCount('HQ Members')).toBe(apiHqMembers);
  // expect(await dashboardPage.getTopBoxCount('Users Can Delete')).toBe(apiUsersCanDelete);
});
