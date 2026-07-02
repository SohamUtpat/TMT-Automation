import { test, expect } from '../fixtures/change-language.fixture';
import { ChangeLanguageData } from '../data/ChangeLanguageData';

test('TC_AP_66 - Verify Language Options Are Displayed', async ({ changeLanguagePage }) => {
  await changeLanguagePage.navigateToChangeLanguage();
  for (const label of ChangeLanguageData.languageLabels) {
    await expect(changeLanguagePage.languageRadio(label)).toBeVisible();
  }
});
