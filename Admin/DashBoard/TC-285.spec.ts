import { test, expect } from '../fixtures/dashboard.fixture';
import { DashboardData } from '../data/DashboardData';

test('TC_AP_285 - Verify Venn Diagram Counts', async ({ dashboardPage }) => {
  await dashboardPage.expectDashboardLoaded();
  await expect(dashboardPage.vennDiagram()).toBeVisible();

  const vennText = await dashboardPage.vennDiagram().innerText();

  for (const category of DashboardData.vennCategories) {
    expect(vennText).toContain(category);
  }

  expect(vennText).toContain(String(DashboardData.vennCounts.mobileUsers));
  expect(vennText).toContain(String(DashboardData.vennCounts.hqMembers));
  expect(vennText).toContain(String(DashboardData.vennCounts.usersCanDelete));
});
