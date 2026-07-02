import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_206 - Verify Pagination 25 Per Page', async ({ mobileUsersPage }) => {
  const apiTotal = await mobileUsersPage.getApiMobileUsersCount();
  const pageSize = MobileUsersData.pagination.defaultPageSize;

  await test.step('Verify default page matches API total and page size', async () => {
    const rows = await mobileUsersPage.getVisibleRowCount();
    const uiTotal = await mobileUsersPage.getTotalUserCount();
    expect(uiTotal).toBe(apiTotal);
    expect(rows).toBeLessThanOrEqual(pageSize);
    if (apiTotal > 0) {
      expect(rows).toBe(Math.min(pageSize, apiTotal));
    }
  });

  await test.step('Navigate to next page when available', async () => {
    if (await mobileUsersPage.nextPageButton().isEnabled()) {
      const response = mobileUsersPage.page.waitForResponse((r) => r.url().includes('/user/mobile'));
      await mobileUsersPage.nextPageButton().click();
      await response;
      expect(await mobileUsersPage.getVisibleRowCount()).toBeGreaterThan(0);
    }
  });
});
