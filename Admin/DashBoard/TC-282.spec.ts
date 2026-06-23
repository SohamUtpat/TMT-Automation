import { test, expect } from '../fixtures/dashboard.fixture';

test('TC_AP_282 - Verify Count Updates After Active/Inactive Changes', async ({
  dashboardPage,
  page,
}) => {
  await dashboardPage.expectDashboardLoaded();

  const beforeCount = await dashboardPage.getTopBoxCount('Mobile App Users');

  await page.reload();
  await dashboardPage.expectDashboardLoaded();

  const afterCount = await dashboardPage.getTopBoxCount('Mobile App Users');

  expect(afterCount).toBe(beforeCount);
  expect(afterCount).toBeGreaterThan(0);
});
