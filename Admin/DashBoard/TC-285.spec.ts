import { test, expect } from '../fixtures/dashboard.fixture';
import { DashboardData } from '../data/DashboardData';

test('TC_AP_285 - Verify Venn Diagram Counts', async ({ dashboardPage }) => {
  await expect(dashboardPage.vennDiagram()).toBeVisible();

  const apiMobileUsers = await dashboardPage.getApiMobileUsersCount();

  const vennText = await dashboardPage.vennDiagram().innerText();

  for (const category of DashboardData.vennCategories) {
    expect(vennText).toContain(category);
  }

  expect(vennText).toContain(String(apiMobileUsers));

  // HQ Members and Users Can Delete — commented out until dedicated filter APIs are mapped.
  // const apiHqMembers = await dashboardPage.getApiHqMembersCount();
  // const apiUsersCanDelete = await dashboardPage.getApiUsersCanDeleteCount();
  // expect(vennText).toContain(String(apiHqMembers));
  // expect(vennText).toContain(String(apiUsersCanDelete));
});
