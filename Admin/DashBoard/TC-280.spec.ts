import { test, expect } from '../fixtures/dashboard.fixture';
import { DashboardData } from '../data/DashboardData';

test('TC_AP_280 - Verify Dashboard Top Boxes', async ({ dashboardPage }) => {
  for (const label of DashboardData.topBoxes) {
    await expect(dashboardPage.topBox(label)).toBeVisible();
    await expect(dashboardPage.topBox(label).locator('p.value')).toBeVisible();
  }
});
