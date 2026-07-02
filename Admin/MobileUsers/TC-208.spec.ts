import { test, expect } from '../fixtures/mobile-users.fixture';

test('TC_AP_208 - Verify Sorting On Listing', async ({ mobileUsersPage }) => {
  const { users } = await mobileUsersPage.fetchMobileUsers();
  test.skip(users.length < 2, 'Need at least 2 mobile users from API to verify sorting');

  await test.step('Sort Username ascending', async () => {
    await mobileUsersPage.clickSort('Username', 'asc');
    const after = await mobileUsersPage.getColumnValues('userName');
    expect(after.length).toBeGreaterThan(0);
    const sorted = [...after].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    expect(after).toEqual(sorted);
  });

  await test.step('Sort Username descending', async () => {
    await mobileUsersPage.clickSort('Username', 'desc');
    const after = await mobileUsersPage.getColumnValues('userName');
    expect(after.length).toBeGreaterThan(0);
    const sorted = [...after].sort((a, b) => b.localeCompare(a, undefined, { sensitivity: 'base' }));
    expect(after).toEqual(sorted);
  });
});
