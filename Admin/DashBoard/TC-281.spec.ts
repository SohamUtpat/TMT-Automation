import { test, expect } from '../fixtures/dashboard.fixture';
import { DashboardData } from '../data/DashboardData';

test('TC_AP_281 - Verify Dashboard Counts Match Actual Data', async ({ dashboardPage }) => {
  await dashboardPage.expectDashboardLoaded();

  expect(await dashboardPage.getTopBoxCount('Mobile App Users')).toBe(
    DashboardData.expectedCounts.mobileUsers
  );
  expect(await dashboardPage.getTopBoxCount('HQ Members')).toBe(
    DashboardData.expectedCounts.hqMembers
  );
  expect(await dashboardPage.getTopBoxCount('Users Can Delete')).toBe(
    DashboardData.expectedCounts.usersCanDelete
  );
  expect(await dashboardPage.getTopBoxCount('Total Groups')).toBe(
    DashboardData.expectedCounts.totalGroups
  );
  expect(await dashboardPage.getTopBoxCount('Admins')).toBe(DashboardData.expectedCounts.admins);
});
