import { test } from '../fixtures/change-language.fixture';

test('TC_AP_65 - Verify Navigate To Change Language From Profile Menu', async ({ changeLanguagePage }) => {
  await changeLanguagePage.openFromProfileMenu();
  await changeLanguagePage.expectChangeLanguagePageLoaded();
});
