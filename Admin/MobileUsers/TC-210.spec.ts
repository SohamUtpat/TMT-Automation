import { test, expect } from '../fixtures/mobile-users.fixture';

test('TC_AP_210 - Verify Groups Filter', async ({ mobileUsersPage }) => {
  const group = await mobileUsersPage.getApiNonHqGroupWithMembers();

  await test.step('Apply Groups filter', async () => {
    await mobileUsersPage.openFilterModal();
    await mobileUsersPage.selectFilterTab('Groups');
    await mobileUsersPage.toggleFilterCheckbox(group.name);
    await mobileUsersPage.applyFilter();
  });

  await test.step('Verify filtered listing has results', async () => {
    const filtered = await mobileUsersPage.fetchMobileUsers({
      filters: { userGroups: [group.code] },
    });
    const rows = await mobileUsersPage.getVisibleRowCount();
    expect(rows).toBeGreaterThan(0);
    expect(rows).toBeLessThanOrEqual(filtered.total);
  });
});
