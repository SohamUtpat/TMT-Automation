import { test } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_220 - Verify Password Maximum Length 15', async ({ mobileUsersPage }) => {
  const password = 'Tt@123456789012'.slice(0, MobileUsersData.limits.passwordMax);
  const user = MobileUsersData.buildValidUser({ password });

  await test.step('Create user with 15-character password', async () => {
    await mobileUsersPage.createMobileUser(user);
  });
});
