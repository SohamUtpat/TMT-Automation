import { test, expect } from '../fixtures/dashboard.fixture';
import { DashboardData } from '../data/DashboardData';

test('TC_AP_291 - Verify Bar Graph Fields', async ({ dashboardPage }) => {
  await dashboardPage.expectDashboardLoaded();

  await dashboardPage.hoverOnGroup(0);
  const tooltip = await dashboardPage.getTooltipText();

  for (const field of DashboardData.barGraphFields) {
    expect(tooltip).toContain(field);
  }

  const hasGroupName = DashboardData.sampleGroups.some((group) => tooltip.includes(group));
  expect(hasGroupName).toBeTruthy();
});
