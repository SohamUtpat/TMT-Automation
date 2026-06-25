import { test, expect } from '../fixtures/mobile-users.fixture';

test('TC_AP_214 - Verify Filter Select All Roles', async ({ mobileUsersPage }) => {
  await test.step('Select all roles and apply filter', async () => {
    await mobileUsersPage.openFilterModal();
    await mobileUsersPage.selectFilterTab('Roles');
    await mobileUsersPage.clickFilterSelectAll();
    await mobileUsersPage.applyFilter();
  });

  await test.step('Verify filtered listing has results', async () => {
    expect(await mobileUsersPage.getVisibleRowCount()).toBeGreaterThan(0);
  });
});
