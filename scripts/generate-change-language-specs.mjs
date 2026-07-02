import fs from 'fs';
import path from 'path';

const outDir = path.resolve('Admin/ChangeLanguage');
fs.mkdirSync(outDir, { recursive: true });

const header = `import { test, expect } from '../fixtures/change-language.fixture';
import { ChangeLanguageData } from '../data/ChangeLanguageData';
`;

const specs = {
  64: `test('TC_AP_64 - Verify Change Language Accessible From Every Page', async ({ changeLanguagePage }) => {
  for (const pageInfo of ChangeLanguageData.pages) {
    await changeLanguagePage.expectAccessibleFromPage(pageInfo.path, pageInfo.title);
  }
});`,

  65: `test('TC_AP_65 - Verify Navigate To Change Language From Profile Menu', async ({ changeLanguagePage }) => {
  await changeLanguagePage.page.goto('/dashboard', { waitUntil: 'commit', timeout: 120_000 });
  await changeLanguagePage.openFromProfileMenu();
  await changeLanguagePage.expectChangeLanguagePageLoaded();
});`,

  66: `test('TC_AP_66 - Verify Language Options Are Displayed', async ({ changeLanguagePage }) => {
  await changeLanguagePage.navigateToChangeLanguage();
  for (const label of ChangeLanguageData.languageLabels) {
    await expect(changeLanguagePage.languageRadio(label)).toBeVisible();
  }
});`,

  67: `test('TC_AP_67 - Verify Default Language Is Pre Selected', async ({ changeLanguagePage }) => {
  await changeLanguagePage.navigateToChangeLanguage();
  await changeLanguagePage.expectLanguageSelected(ChangeLanguageData.languages.english.label);
});`,

  68: `test('TC_AP_68 - Verify Confirm Language Button Is Present', async ({ changeLanguagePage }) => {
  await changeLanguagePage.navigateToChangeLanguage();
  await expect(changeLanguagePage.confirmLanguageButton()).toBeVisible();
});`,

  69: `test('TC_AP_69 - Verify Confirmation Modal On Confirm Language', async ({ changeLanguagePage }) => {
  await changeLanguagePage.navigateToChangeLanguage();
  await changeLanguagePage.selectLanguage(ChangeLanguageData.languages.thai.label);
  await changeLanguagePage.clickConfirmLanguage();
  await expect(changeLanguagePage.confirmModal()).toBeVisible();
  await expect(changeLanguagePage.confirmModal()).toContainText(ChangeLanguageData.messages.updateConfirmation);
  await changeLanguagePage.confirmModalAction(false);
});`,

  70: `test('TC_AP_70 - Verify Cancel Modal Does Not Update Language', async ({ changeLanguagePage }) => {
  await changeLanguagePage.navigateToChangeLanguage();
  await changeLanguagePage.selectLanguage(ChangeLanguageData.languages.thai.label);
  await changeLanguagePage.clickConfirmLanguage();
  await changeLanguagePage.confirmModalAction(false);
  await changeLanguagePage.expectDashboardTitle(ChangeLanguageData.languages.english.dashboardTitle);
});`,

  71: `test('TC_AP_71 - Verify Language Can Be Changed To Thai', async ({ changeLanguagePage }) => {
  await changeLanguagePage.navigateToChangeLanguage();
  await changeLanguagePage.submitLanguageChange(ChangeLanguageData.languages.thai.label);
  await changeLanguagePage.expectDashboardTitle(ChangeLanguageData.languages.thai.dashboardTitle);
});`,

  72: `test('TC_AP_72 - Verify Language Can Be Changed To Japanese', async ({ changeLanguagePage }) => {
  await changeLanguagePage.navigateToChangeLanguage();
  await changeLanguagePage.submitLanguageChange(ChangeLanguageData.languages.japanese.label);
  await changeLanguagePage.expectDashboardTitle(ChangeLanguageData.languages.japanese.dashboardTitle);
});`,

  73: `test('TC_AP_73 - Verify Language Can Be Changed Back To English', async ({ changeLanguagePage }) => {
  await changeLanguagePage.navigateToChangeLanguage();
  await changeLanguagePage.submitLanguageChange(ChangeLanguageData.languages.thai.label);
  await changeLanguagePage.navigateToChangeLanguage();
  await changeLanguagePage.submitLanguageChange(ChangeLanguageData.languages.english.label);
  await changeLanguagePage.expectDashboardTitle(ChangeLanguageData.languages.english.dashboardTitle);
});`,

  74: `test('TC_AP_74 - Verify Confirm Language Button Shows Pointer Cursor', async ({ changeLanguagePage }) => {
  await changeLanguagePage.navigateToChangeLanguage();
  await changeLanguagePage.expectButtonPointerCursor(changeLanguagePage.confirmLanguageButton());
});`,

  75: `test('TC_AP_75 - Verify Back Button Navigates To Previous Page', async ({ changeLanguagePage }) => {
  await changeLanguagePage.page.goto('/dashboard', { waitUntil: 'commit', timeout: 120_000 });
  await changeLanguagePage.openFromProfileMenu();
  await changeLanguagePage.backButton().click();
  await expect(changeLanguagePage.page).toHaveURL(/\\/dashboard/);
});`,
};

const ids = Object.keys(specs)
  .map(Number)
  .sort((a, b) => a - b);

for (const id of ids) {
  const file = path.join(outDir, `TC-${id}.spec.ts`);
  fs.writeFileSync(file, `${header}\n${specs[id]}\n`);
  console.log(`Wrote ${file}`);
}

console.log(`Generated ${ids.length} change language spec files.`);
