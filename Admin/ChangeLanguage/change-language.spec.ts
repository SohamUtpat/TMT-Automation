import { test, expect } from '../fixtures/change-language.fixture';
import { ChangeLanguageData } from '../data/ChangeLanguageData';

test('TC_AP_65 - Verify Navigate To Change Language From Profile Menu', async ({ changeLanguagePage }) => {
  await changeLanguagePage.openFromProfileMenu();
  await changeLanguagePage.expectChangeLanguagePageLoaded();
});

test('TC_AP_66 - Verify Language Options Are Displayed', async ({ changeLanguagePage }) => {
  await changeLanguagePage.navigateToChangeLanguage();
  for (const label of ChangeLanguageData.languageLabels) {
    await expect(changeLanguagePage.languageRadio(label)).toBeVisible();
  }
});

test('TC_AP_67 - Verify Default Language Is Pre Selected', async ({ changeLanguagePage }) => {
  await test.step('Navigate to change language page', async () => {
    await changeLanguagePage.navigateToChangeLanguage();
  });

  await test.step('Verify change language page title is displayed', async () => {
    await expect(changeLanguagePage.changeLanguagePageTitle()).toHaveText(
      ChangeLanguageData.buttons.changeLanguage,
    );
  });

  await test.step('Verify one language is pre-selected', async () => {
    const selectedLanguage = changeLanguagePage.page.locator('input[type="radio"]:checked');
    await expect(selectedLanguage).toHaveCount(1);
    await expect(selectedLanguage).toBeVisible();
  });
});

test('TC_AP_68 - Verify Confirm Language Button Is Present', async ({ changeLanguagePage }) => {
  await changeLanguagePage.navigateToChangeLanguage();
  await expect(changeLanguagePage.confirmLanguageButton()).toBeVisible();
});

test('TC_AP_69 - Verify Confirmation Modal On Confirm Language', async ({ changeLanguagePage }) => {
  await changeLanguagePage.navigateToChangeLanguage();
  await changeLanguagePage.selectLanguage(ChangeLanguageData.languages.thai.label);
  await changeLanguagePage.clickConfirmLanguage();
  await expect(changeLanguagePage.confirmModal()).toBeVisible();
  await expect(changeLanguagePage.confirmModal()).toContainText(ChangeLanguageData.messages.updateConfirmation);
  await changeLanguagePage.confirmModalAction(false);
});

test('TC_AP_70 - Verify Cancel Modal Does Not Update Language', async ({ changeLanguagePage }) => {
  await changeLanguagePage.navigateToChangeLanguage();
  await changeLanguagePage.selectLanguage(ChangeLanguageData.languages.thai.label);
  await changeLanguagePage.clickConfirmLanguage();
  await changeLanguagePage.confirmModalAction(false);
  await changeLanguagePage.expectChangeLanguagePageTitleForLanguage('english');
});

test('TC_AP_71 - Verify Language Can Be Changed To Thai', async ({ changeLanguagePage }) => {
  await changeLanguagePage.changeLanguageAndVerify('thai');
});

test('TC_AP_72 - Verify Language Can Be Changed To Japanese', async ({ changeLanguagePage }) => {
  await changeLanguagePage.changeLanguageAndVerify('japanese');
});

test('TC_AP_73 - Verify Language Can Be Changed Back To English', async ({ changeLanguagePage }) => {
  await changeLanguagePage.changeLanguageAndVerify('thai');
  await changeLanguagePage.changeLanguageAndVerify('english');
});

test('TC_AP_74 - Verify Confirm Language Button Shows Pointer Cursor', async ({ changeLanguagePage }) => {
  await changeLanguagePage.navigateToChangeLanguage();
  await changeLanguagePage.expectButtonPointerCursor(changeLanguagePage.confirmLanguageButton());
});

test('TC_AP_75 - Verify Back Button Navigates To Previous Page', async ({ changeLanguagePage }) => {
  await changeLanguagePage.openFromProfileMenu();
  await changeLanguagePage.backButton().click();
  await expect(changeLanguagePage.page).toHaveURL(/\/dashboard/);
});
