import { test, expect } from '../fixtures/change-language.fixture';

test('TC_AP_74 - Verify Confirm Language Button Shows Pointer Cursor', async ({ changeLanguagePage }) => {
  await changeLanguagePage.navigateToChangeLanguage();
  await changeLanguagePage.expectButtonPointerCursor(changeLanguagePage.confirmLanguageButton());
});
