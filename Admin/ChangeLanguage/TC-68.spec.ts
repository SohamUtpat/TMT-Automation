import { test, expect } from '../fixtures/change-language.fixture';

test('TC_AP_68 - Verify Confirm Language Button Is Present', async ({ changeLanguagePage }) => {
  await changeLanguagePage.navigateToChangeLanguage();
  await expect(changeLanguagePage.confirmLanguageButton()).toBeVisible();
});
