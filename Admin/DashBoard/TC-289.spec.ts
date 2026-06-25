import { test, expect } from '../fixtures/dashboard.fixture';
import { DashboardData } from '../data/DashboardData';

test('TC_AP_289 - Verify Tooltip User Categories', async ({ dashboardPage }) => {
  await dashboardPage.hoverOnGroup(0);
  const tooltip = await dashboardPage.getTooltipText();

  for (const field of DashboardData.graphTooltipFields) {
    expect(tooltip).toContain(field);
  }
});
