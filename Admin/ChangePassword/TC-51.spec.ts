import { test, expect } from '../fixtures/change-password.fixture';
import { ChangePasswordData } from '../data/ChangePasswordData';

test('TC_AP_51 - Verify Change Password Accessible From Every Page', async ({ changePasswordPage }) => {
  for (const pageInfo of ChangePasswordData.pages) {
    await changePasswordPage.expectAccessibleFromPage(pageInfo.path, pageInfo.title);
  }
});
