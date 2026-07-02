import { test, expect } from '../fixtures/change-language.fixture';
import { ChangeLanguageData } from '../data/ChangeLanguageData';

test('TC_AP_69 - Verify Confirmation Modal On Confirm Language', async ({ changeLanguagePage }) => {
  await changeLanguagePage.navigateToChangeLanguage();
  await changeLanguagePage.selectLanguage(ChangeLanguageData.languages.thai.label);
  await changeLanguagePage.clickConfirmLanguage();
  await expect(changeLanguagePage.confirmModal()).toBeVisible();
  await expect(changeLanguagePage.confirmModal()).toContainText(ChangeLanguageData.messages.updateConfirmation);
  await changeLanguagePage.confirmModalAction(false);
});
