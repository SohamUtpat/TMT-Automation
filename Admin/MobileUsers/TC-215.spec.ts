import { test, expect } from '../fixtures/mobile-users.fixture';

test('TC_AP_215 - Verify Filter Clear All', async ({ mobileUsersPage }) => {
  await test.step('Select all groups then clear all filters', async () => {
    await mobileUsersPage.openFilterModal();
    await mobileUsersPage.selectFilterTab('Groups');
    await mobileUsersPage.clickFilterSelectAll();
    await mobileUsersPage.clickFilterClearAll();
    await mobileUsersPage.applyFilter();
  });

  await test.step('Verify listing still shows results', async () => {
    expect(await mobileUsersPage.getVisibleRowCount()).toBeGreaterThan(0);
  });
});
