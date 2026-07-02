import { test, expect } from '../fixtures/change-language.fixture';
import { ChangeLanguageData } from '../data/ChangeLanguageData';

test('TC_AP_67 - Verify Default Language Is Pre Selected', async ({ changeLanguagePage }) => {
  await test.step('Navigate to change language page', async () => {
    await changeLanguagePage.navigateToChangeLanguage();
  });

  await test.step('Verify change language page title is displayed', async () => {
    await expect(changeLanguagePage.page.locator('#pageTitle')).toHaveText(
      ChangeLanguageData.buttons.changeLanguage,
    );
  });

  await test.step('Verify one language is pre-selected', async () => {
    const selectedLanguage = changeLanguagePage.page.locator('input[type="radio"]:checked');
    await expect(selectedLanguage).toHaveCount(1);
    await expect(selectedLanguage).toBeVisible();
  });
});
