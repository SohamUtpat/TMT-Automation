import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_212 - Verify Status Filter', async ({ mobileUsersPage }) => {
  await test.step('Apply Status filter for Active', async () => {
    await mobileUsersPage.openFilterModal();
    await mobileUsersPage.selectFilterTab('Status');
    await mobileUsersPage.toggleFilterCheckbox('Active');
    await mobileUsersPage.applyFilter();
  });

  await test.step('Verify all visible users have Active status', async () => {
    const statuses = await mobileUsersPage.getColumnValues('status');
    expect(statuses.every((s) => s === MobileUsersData.status.active)).toBe(true);
  });
});
