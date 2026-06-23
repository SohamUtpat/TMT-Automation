import { test, expect } from '../fixtures/dashboard.fixture';
import { DashboardData } from '../data/DashboardData';

test('TC_AP_288 - Verify Empty Groups Not Displayed', async ({ dashboardPage }) => {
  await dashboardPage.expectDashboardLoaded();

  const groupLabels = await dashboardPage.getGraphGroupLabels();

  expect(groupLabels.length).toBeGreaterThan(0);
  expect(groupLabels).not.toContain(DashboardData.emptyGroupName);
});
