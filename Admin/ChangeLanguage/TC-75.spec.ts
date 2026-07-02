import { test, expect } from '../fixtures/change-language.fixture';
import { ChangeLanguageData } from '../data/ChangeLanguageData';

test('TC_AP_75 - Verify Back Button Navigates To Previous Page', async ({ changeLanguagePage }) => {
  await changeLanguagePage.openFromProfileMenu();
  await changeLanguagePage.backButton().click();
  await expect(changeLanguagePage.page).toHaveURL(/\/dashboard/);
});
