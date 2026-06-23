import { test, expect } from '../fixtures/dashboard.fixture';
import { DashboardData } from '../data/DashboardData';

test('TC_AP_286 - Verify Mobile App Users Click Action', async ({ dashboardPage, page }) => {
  await dashboardPage.expectDashboardLoaded();

  await dashboardPage.mobileAppUsersLink().click();

  await expect(page).toHaveURL(new RegExp(DashboardData.mobileUsersPagePath));
  await expect(page.getByText('Mobile Users').first()).toBeVisible();
  await expect(page.getByText(DashboardData.mobileUsersPaginationPattern)).toBeVisible();
});
