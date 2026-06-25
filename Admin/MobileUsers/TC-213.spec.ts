import { test, expect } from '../fixtures/mobile-users.fixture';

test('TC_AP_213 - Verify Filter Select All Groups', async ({ mobileUsersPage }) => {
  await test.step('Select all groups and apply filter', async () => {
    await mobileUsersPage.openFilterModal();
    await mobileUsersPage.selectFilterTab('Groups');
    await mobileUsersPage.clickFilterSelectAll();
    await mobileUsersPage.applyFilter();
  });

  await test.step('Verify filtered listing has results', async () => {
    expect(await mobileUsersPage.getVisibleRowCount()).toBeGreaterThan(0);
  });
});
