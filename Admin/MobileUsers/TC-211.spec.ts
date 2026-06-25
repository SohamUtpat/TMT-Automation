import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_211 - Verify Roles Filter', async ({ mobileUsersPage }) => {
  await test.step('Apply Roles filter for HQ', async () => {
    await mobileUsersPage.openFilterModal();
    await mobileUsersPage.selectFilterTab('Roles');
    await mobileUsersPage.toggleFilterCheckbox('HQ');
    await mobileUsersPage.applyFilter();
  });

  await test.step('Verify Role HQ column values match filter', async () => {
    const hqCol = await mobileUsersPage.getColumnValues('roleHq');
    expect(hqCol.every((v) => v === MobileUsersData.roles.yes || v === '-')).toBe(true);
  });
});
