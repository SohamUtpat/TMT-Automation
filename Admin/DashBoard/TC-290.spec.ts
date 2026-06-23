import { test, expect } from '../fixtures/dashboard.fixture';
import { DashboardData } from '../data/DashboardData';

test('TC_AP_290 - Verify Graph User Counts', async ({ dashboardPage }) => {
  await dashboardPage.expectDashboardLoaded();

  const graphBarsCount = await dashboardPage.getGraphBarCount();
  const groupLabels = await dashboardPage.getGraphGroupLabels();

  expect(graphBarsCount).toBeGreaterThan(0);
  expect(groupLabels.length).toBeGreaterThan(0);

  const mobileUsers = await dashboardPage.getTopBoxCount('Mobile App Users');
  expect(mobileUsers).toBe(DashboardData.expectedCounts.mobileUsers);
});
