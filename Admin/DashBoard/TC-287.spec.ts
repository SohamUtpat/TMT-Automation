import { test, expect } from '../fixtures/dashboard.fixture';
import { DashboardData } from '../data/DashboardData';

test('TC_AP_287 - Verify Group Wise User Graph', async ({ dashboardPage }) => {
  await dashboardPage.expectDashboardLoaded();
  await dashboardPage.scrollToGraph();

  await expect(dashboardPage.groupUserGraph()).toBeVisible();
  await expect(dashboardPage.page.getByText(DashboardData.graphAxisLabels.x)).toBeVisible();
  await expect(dashboardPage.page.getByText(DashboardData.graphAxisLabels.y)).toBeVisible();
});
