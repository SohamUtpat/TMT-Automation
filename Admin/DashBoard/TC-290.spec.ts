import { test, expect } from '../fixtures/dashboard.fixture';

test('TC_AP_290 - Verify Graph User Counts', async ({ dashboardPage }) => {
  const graphBarsCount = await dashboardPage.getGraphBarCount();
  const groupLabels = await dashboardPage.getGraphGroupLabels();

  expect(graphBarsCount).toBeGreaterThan(0);
  expect(groupLabels.length).toBeGreaterThan(0);

  const apiMobileUsers = await dashboardPage.getApiMobileUsersCount();
  const mobileUsers = await dashboardPage.getTopBoxCount('Mobile App Users');
  expect(mobileUsers).toBe(apiMobileUsers);
});
