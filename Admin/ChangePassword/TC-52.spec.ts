import { test, expect } from '../fixtures/change-password.fixture';
import { ChangePasswordData } from '../data/ChangePasswordData';

test('TC_AP_52 - Verify Navigate To Change Password From Profile Menu', async ({ changePasswordPage }) => {
  await changePasswordPage.page.goto('/dashboard', { waitUntil: 'commit', timeout: 120_000 });
  await changePasswordPage.openFromProfileMenu();
  await changePasswordPage.expectChangePasswordPageLoaded();
});
