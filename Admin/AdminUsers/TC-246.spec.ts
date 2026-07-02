import { test, expect } from '../fixtures/admin-users.fixture';
import { AdminUsersData } from '../data/AdminUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_246 - Verify Pagination Shows 25 Users Per Page', async ({ adminUsersPage }) => {
  const apiTotal = await adminUsersPage.getApiAdminUsersCount();
  const visibleRows = await adminUsersPage.getVisibleRowCount();
  expect(visibleRows).toBeLessThanOrEqual(AdminUsersData.pagination.defaultPageSize);
  if (apiTotal > AdminUsersData.pagination.defaultPageSize) {
    expect(visibleRows).toBe(AdminUsersData.pagination.defaultPageSize);
    await expect(adminUsersPage.nextPageButton()).toBeEnabled();
    await adminUsersPage.nextPageButton().click();
    await adminUsersPage.waitForListingRefresh();
    expect(await adminUsersPage.getVisibleRowCount()).toBeGreaterThan(0);
    await adminUsersPage.goToFirstPage();
  }
});
