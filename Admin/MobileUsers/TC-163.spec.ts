import { test, expect } from '../fixtures/mobile-users.fixture';
import { MobileUsersData } from '../data/MobileUsersData';

test('TC_AP_163 - Verify Profile Photo Format Validation', async ({ mobileUsersPage }) => {
  await mobileUsersPage.clickCreateUser();
  await mobileUsersPage.uploadProfilePhoto(MobileUsersData.testAssets.invalidPdf);
  await mobileUsersPage.expectUploadError(MobileUsersData.validation.invalidImageFormat);
});
