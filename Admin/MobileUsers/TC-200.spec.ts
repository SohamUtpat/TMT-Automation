import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_200 - Verify Listing Columns', async ({ mobileUsersPage }) => {
  await test.step('Verify all expected column headers are visible', async () => {
    for (const col of MobileUsersData.listingColumns) {
      await mobileUsersPage.expectColumnHeaderVisible(col);
    }
  });

  await test.step('Verify edit action is available on listing rows', async () => {
    await expect(mobileUsersPage.tableRows().first().locator('.edit-icon')).toBeVisible();
  });
});
