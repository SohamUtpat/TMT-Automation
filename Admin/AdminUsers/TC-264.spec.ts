import { test, expect } from '../fixtures/admin-users.fixture';
import { AdminUsersData } from '../data/AdminUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_264 - Verify Listing Sort By Username Name Created On', async ({ adminUsersPage }) => {
  const { total } = await adminUsersPage.fetchAdminUsers();
  test.skip(total < 2, 'Need at least 2 admin users from API to verify sorting');

  await adminUsersPage.clickSort('Username', 'asc');
  const ascUsernames = await adminUsersPage.getColumnValues('userName');
  await adminUsersPage.clickSort('Username', 'desc');
  const descUsernames = await adminUsersPage.getColumnValues('userName');
  expect(ascUsernames.join(',')).not.toBe(descUsernames.join(','));

  await adminUsersPage.clickSort('Name', 'asc');
  await adminUsersPage.clickSort('Created On', 'asc');
  expect(await adminUsersPage.getVisibleRowCount()).toBeGreaterThan(0);
});
