import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_206 - Verify Pagination 25 Per Page', async ({ mobileUsersPage }) => {
  await test.step('Verify default page shows at most 25 rows', async () => {
    const rows = await mobileUsersPage.getVisibleRowCount();
    expect(rows).toBeLessThanOrEqual(MobileUsersData.pagination.defaultPageSize);
    expect(rows).toBeGreaterThan(0);
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
