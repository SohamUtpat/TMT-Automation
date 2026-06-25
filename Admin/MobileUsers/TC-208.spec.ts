import { test, expect } from '../fixtures/mobile-users.fixture';

test('TC_AP_208 - Verify Sorting On Listing', async ({ mobileUsersPage }) => {
  await test.step('Sort Username ascending', async () => {
    const before = await mobileUsersPage.getColumnValues('userName');
    await mobileUsersPage.clickSort('Username', 'asc');
    const after = await mobileUsersPage.getColumnValues('userName');
    expect(after.length).toBeGreaterThan(0);
    expect(JSON.stringify(before)).not.toEqual(JSON.stringify(after));
  });

  await test.step('Sort Username descending', async () => {
    await mobileUsersPage.clickSort('Username', 'desc');
    expect(await mobileUsersPage.getColumnValues('userName')).not.toHaveLength(0);
  });
});
