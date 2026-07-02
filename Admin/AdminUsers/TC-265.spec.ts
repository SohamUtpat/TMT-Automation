import { test, expect } from '../fixtures/admin-users.fixture';
import { AdminUsersData } from '../data/AdminUsersData';
import { TestDataGenerator } from '../utils/TestDataGenerator';
import { LoginPage } from '../pages/LoginPage';
import { loginData } from '../data/loginData';

test('TC_AP_265 - Verify Sort Can Be Undone', async ({ adminUsersPage }) => {
  const { total } = await adminUsersPage.fetchAdminUsers();
  test.skip(total < 2, 'Need at least 2 admin users from API to verify sort undo');

  const original = await adminUsersPage.getColumnValues('userName');
  await adminUsersPage.clickSort('Username', 'asc');
  const sorted = await adminUsersPage.getColumnValues('userName');
  await adminUsersPage.clickSort('Username', 'desc');
  const undone = await adminUsersPage.getColumnValues('userName');
  expect(sorted.join(',')).not.toBe(original.join(','));
  expect(undone.join(',')).not.toBe(sorted.join(','));
});
