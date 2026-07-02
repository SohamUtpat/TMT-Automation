import { test, expect } from '../fixtures/change-language.fixture';
import { ChangeLanguageData } from '../data/ChangeLanguageData';

test('TC_AP_70 - Verify Cancel Modal Does Not Update Language', async ({ changeLanguagePage }) => {
  await changeLanguagePage.navigateToChangeLanguage();
  await changeLanguagePage.selectLanguage(ChangeLanguageData.languages.thai.label);
  await changeLanguagePage.clickConfirmLanguage();
  await changeLanguagePage.confirmModalAction(false);
  await changeLanguagePage.expectChangeLanguagePageTitleForLanguage('english');
});
