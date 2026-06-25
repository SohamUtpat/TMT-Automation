import { test, expect } from '../fixtures/mobile-users.fixture';

test('TC_AP_210 - Verify Groups Filter', async ({ mobileUsersPage }) => {
  await test.step('Apply Groups filter', async () => {
    await mobileUsersPage.openFilterModal();
    await mobileUsersPage.selectFilterTab('Groups');
    await mobileUsersPage.toggleFilterCheckbox('Test');
    await mobileUsersPage.applyFilter();
  });

  await test.step('Verify filtered listing has results', async () => {
    expect(await mobileUsersPage.getVisibleRowCount()).toBeGreaterThan(0);
  });
});
