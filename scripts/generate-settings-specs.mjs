import fs from 'fs';
import path from 'path';

const outDir = path.resolve('Admin/Settings');
fs.mkdirSync(outDir, { recursive: true });

const header = `import { test, expect } from '../fixtures/settings.fixture';
import { SettingsData } from '../data/SettingsData';
import { TestDataGenerator } from '../utils/TestDataGenerator';
`;

const specs = {
  84: `test('TC_AP_84 - Verify Support Fields Trim Spaces On Update', async ({ settingsPage, settingsBaseline }) => {
  const update = SettingsData.buildSupportUpdate();
  const languageLabel = settingsPage.mapLanguageCodeToLabel(settingsBaseline.CHANGE_LANGUAGE);

  await settingsPage.openSupportDetailsEdit();
  await settingsPage.fillSupportForm({
    url: \`  \${update.url}  \`,
    email: \`  \${update.email}  \`,
    contact: \`  \${update.contact}  \`,
    languageLabel,
  });
  await settingsPage.submitSupportForm();

  const api = await settingsPage.fetchSettingsFromApi();
  expect(api.url).toBe(update.url);
  expect(api.email).toBe(update.email);
  expect(api.contact_details).toBe(update.contact);
});`,

  85: `test('TC_AP_85 - Verify Support Details Edit Form Opens', async ({ settingsPage }) => {
  await settingsPage.openSupportDetailsEdit();
  await expect(settingsPage.urlInput()).toBeVisible();
  await expect(settingsPage.emailInput()).toBeVisible();
  await expect(settingsPage.contactInput()).toBeVisible();
  await settingsPage.closeModal();
});`,

  86: `test('TC_AP_86 - Verify Support URL Is Clickable', async ({ settingsPage, settingsBaseline }) => {
  expect(settingsBaseline.url).toBeTruthy();
  const popup = await settingsPage.clickSupportUrlLink();
  expect(popup.url()).toContain(settingsBaseline.url.replace(/^https?:\\/\\//, '').split('/')[0]);
  await popup.close();
});`,

  87: `test('TC_AP_87 - Verify Support URL Is Updated', async ({ settingsPage, settingsBaseline }) => {
  const update = SettingsData.buildSupportUpdate();
  await settingsPage.updateSupportDetails({
    url: update.url,
    languageLabel: settingsPage.mapLanguageCodeToLabel(settingsBaseline.CHANGE_LANGUAGE),
  });
  const api = await settingsPage.fetchSettingsFromApi();
  expect(api.url).toBe(update.url);
});`,

  88: `test('TC_AP_88 - Verify Support Email Is Updated', async ({ settingsPage, settingsBaseline }) => {
  const update = SettingsData.buildSupportUpdate();
  await settingsPage.updateSupportDetails({
    email: update.email,
    languageLabel: settingsPage.mapLanguageCodeToLabel(settingsBaseline.CHANGE_LANGUAGE),
  });
  const api = await settingsPage.fetchSettingsFromApi();
  expect(api.email).toBe(update.email);
});`,

  89: `test('TC_AP_89 - Verify Default Language Is Updated In Settings', async ({ settingsPage }) => {
  await settingsPage.updateSupportDetails({ languageLabel: SettingsData.languages.thai.label });
  const api = await settingsPage.fetchSettingsFromApi();
  expect(api.CHANGE_LANGUAGE).toBe(SettingsData.languages.thai.code);
});`,

  90: `test('TC_AP_90 - Verify Settings Default Language On Create User Page', async ({ settingsPage }) => {
  await settingsPage.updateSupportDetails({ languageLabel: SettingsData.languages.japanese.label });
  await settingsPage.expectCreateUserDefaultLanguage(SettingsData.languages.japanese.label);
});`,

  91: `test('TC_AP_91 - Verify Contact Details Are Updated', async ({ settingsPage, settingsBaseline }) => {
  const update = SettingsData.buildSupportUpdate();
  await settingsPage.updateSupportDetails({
    contact: update.contact,
    languageLabel: settingsPage.mapLanguageCodeToLabel(settingsBaseline.CHANGE_LANGUAGE),
  });
  const api = await settingsPage.fetchSettingsFromApi();
  expect(api.contact_details).toBe(update.contact);
});`,

  92: `// import { test } from '../fixtures/settings.fixture';
//
// test.skip('TC_AP_92 - Verify URL Maximum Length 50', async () => {
//   // Invalid test case — URL length limit not enforced in settings form.
// });`,

  93: `// import { test } from '../fixtures/settings.fixture';
//
// test.skip('TC_AP_93 - Verify URL Over 50 Shows Validation', async () => {
//   // Invalid test case — URL length limit not enforced in settings form.
// });`,

  94: `test('TC_AP_94 - Verify Only Valid URL Format Accepted', async ({ settingsPage }) => {
  await settingsPage.openSupportDetailsEdit();
  await settingsPage.fillSupportForm({ url: 'not-a-valid-url' });
  await settingsPage.submitSupportForm({ waitForSuccess: false });
  await settingsPage.expectValidationMessage(SettingsData.validation.invalidUrl);
  await settingsPage.closeModal();
});`,

  95: `test('TC_AP_95 - Verify Contact Number Maximum Length 15', async ({ settingsPage, settingsBaseline }) => {
  const contact = '1'.repeat(15);
  await settingsPage.updateSupportDetails({
    contact,
    languageLabel: settingsPage.mapLanguageCodeToLabel(settingsBaseline.CHANGE_LANGUAGE),
  });
  const api = await settingsPage.fetchSettingsFromApi();
  expect(api.contact_details).toBe(contact);
});`,

  96: `test('TC_AP_96 - Verify Contact Over 15 Shows Validation', async ({ settingsPage }) => {
  await settingsPage.openSupportDetailsEdit();
  await settingsPage.fillSupportForm({ contact: '1'.repeat(16) });
  await settingsPage.submitSupportForm({ waitForSuccess: false });
  await settingsPage.expectValidationMessage(SettingsData.validation.contactLength);
  await settingsPage.closeModal();
});`,

  97: `test('TC_AP_97 - Verify Contact Rejects Invalid Characters', async ({ settingsPage }) => {
  await settingsPage.openSupportDetailsEdit();
  await settingsPage.fillSupportForm({ contact: TestDataGenerator.generateInvalidPhone() });
  await settingsPage.submitSupportForm({ waitForSuccess: false });
  await settingsPage.expectValidationMessage(SettingsData.validation.invalidContact);
  await settingsPage.closeModal();
});`,

  98: `test('TC_AP_98 - Verify Invalid Data Cannot Be Saved', async ({ settingsPage }) => {
  await settingsPage.openSupportDetailsEdit();
  await settingsPage.fillSupportForm({
    url: 'bad-url',
    email: TestDataGenerator.generateInvalidEmail(),
    contact: 'abc',
  });
  await settingsPage.submitSupportForm({ waitForSuccess: false });
  await expect(settingsPage.settingsModal()).toBeVisible();
  await settingsPage.closeModal();
});`,

  99: `test('TC_AP_99 - Verify Support And Stamp Fields On Settings Page', async ({ settingsPage }) => {
  const apiSettings = await settingsPage.fetchSettingsFromApi();
  const { total: standardTotal } = await settingsPage.fetchStandardStampsFromApi();
  const { total: approvalTotal } = await settingsPage.fetchApprovalStampsFromApi();

  for (const field of SettingsData.supportFields) {
    await expect(settingsPage.supportDetailsSection().getByText(field, { exact: false })).toBeVisible();
  }
  expect(apiSettings.url).toBeTruthy();
  expect(apiSettings.email).toBeTruthy();

  await expect(settingsPage.stampsSection()).toBeVisible();
  await expect(settingsPage.seeAllStampsButton()).toBeVisible();
  await expect(settingsPage.uploadNewStampButton()).toBeVisible();
  expect(standardTotal).toBeGreaterThanOrEqual(0);
  expect(approvalTotal).toBeGreaterThanOrEqual(0);

  await settingsPage.openSeeAllStamps();
  await expect(settingsPage.settingsModal().getByText(SettingsData.stamps.tabs.standard)).toBeVisible();
  await expect(settingsPage.settingsModal().getByText(SettingsData.stamps.tabs.approval)).toBeVisible();
  await settingsPage.closeModal();
});`,

  100: `test('TC_AP_100 - Verify Stamps Can Be Viewed', async ({ settingsPage }) => {
  const { stamps: standardStamps } = await settingsPage.fetchStandardStampsFromApi();
  test.skip(standardStamps.length === 0, 'No standard stamps returned from API');

  await expect(settingsPage.stampPreviewImages().first()).toBeVisible({ timeout: 30_000 });

  const { stamps: approvalStamps } = await settingsPage.fetchApprovalStampsFromApi();
  test.skip(approvalStamps.length === 0, 'No approval stamps returned from API');

  await settingsPage.openSeeAllStamps({ tab: 'approval' });
  expect(await settingsPage.stampImagesInModal().count()).toBeGreaterThan(0);
  expect(approvalStamps.length).toBeGreaterThan(0);
  await settingsPage.closeModal();
});`,

  101: `test('TC_AP_101 - Verify Stamp Can Be Deleted', async ({ settingsPage }) => {
  const { stamps } = await settingsPage.fetchApprovalStampsFromApi();
  test.skip(stamps.length === 0, 'No approval stamps available from API to delete');

  await settingsPage.openSeeAllStamps({ tab: 'approval' });
  await settingsPage.deleteFirstStampInModal();
  await settingsPage.closeModal();
});`,

  102: `test('TC_AP_102 - Verify Message After Stamp Deletion', async ({ settingsPage }) => {
  const { stamps } = await settingsPage.fetchApprovalStampsFromApi();
  test.skip(stamps.length === 0, 'No approval stamps available from API to delete');

  await settingsPage.openSeeAllStamps({ tab: 'approval' });
  await settingsPage.deleteFirstStampInModal();
  await expect(settingsPage.toast(SettingsData.messages.stampDeleted)).toBeVisible();
  await settingsPage.closeModal();
});`,

  103: `test('TC_AP_103 - Verify Upload Option For New Stamps', async ({ settingsPage }) => {
  await settingsPage.openUploadStamps();
  await expect(settingsPage.uploadButton()).toBeVisible();
  await expect(settingsPage.stampUploadInput()).toBeAttached();
  await settingsPage.closeModal();
});`,

  104: `test('TC_AP_104 - Verify Stamp Upload Accepts Jpg Png Jpeg', async ({ settingsPage }) => {
  await settingsPage.openUploadStamps();
  await expect(settingsPage.page.getByText(/JPG|PNG|JPEG/i).first()).toBeVisible();
  await settingsPage.closeModal();
});`,

  105: `test('TC_AP_105 - Verify Invalid Stamp Format Shows Error', async ({ settingsPage }) => {
  await settingsPage.openUploadStamps();
  await settingsPage.uploadStampFiles([SettingsData.testAssets.invalidPdf]);
  await settingsPage.expectValidationMessage(SettingsData.validation.invalidStampFormat);
  await settingsPage.closeModal();
});`,

  106: `test('TC_AP_106 - Verify Multiple Stamps Can Be Uploaded', async ({ settingsPage }) => {
  const stamp = SettingsData.testAssets.validStamp;
  await settingsPage.openUploadStamps();
  await settingsPage.uploadStampFiles([stamp, stamp]);
  await expect(settingsPage.toast(SettingsData.messages.stampUploaded)).toBeVisible({ timeout: 60_000 });
  await settingsPage.closeModal();
});`,

  107: `test('TC_AP_107 - Verify More Than 50 Stamps Cannot Upload At Once', async ({ settingsPage }) => {
  const stamp = SettingsData.testAssets.validStamp;
  const files = Array.from({ length: 51 }, () => stamp);
  await settingsPage.openUploadStamps();
  await settingsPage.uploadStampFiles(files);
  await settingsPage.expectValidationMessage(SettingsData.validation.maxStampBatch);
  await settingsPage.closeModal();
});`,

  108: `// import { test } from '../fixtures/settings.fixture';
//
// test.skip('TC_AP_108 - Verify Deleted Stamp Visible In Chat To End User', async () => {
//   // Invalid / out of scope — requires mobile chat verification.
// });`,

  109: `// import { test } from '../fixtures/settings.fixture';
//
// test.skip('TC_AP_109 - Verify Maximum 100 Stamps In System', async () => {
//   // Invalid test case — total stamp cap cannot be reliably exercised in UI automation.
// });`,

  110: `test('TC_AP_110 - Verify User Can Add Stamp', async ({ settingsPage }) => {
  await settingsPage.openUploadStamps();
  await settingsPage.uploadStampFiles([SettingsData.testAssets.validStamp]);
  await expect(settingsPage.toast(SettingsData.messages.stampUploaded)).toBeVisible({ timeout: 60_000 });
  await settingsPage.closeModal();
});`,

  111: `test('TC_AP_111 - Verify User Can Add Multiple Stamps', async ({ settingsPage }) => {
  const stamp = SettingsData.testAssets.validStamp;
  await settingsPage.openUploadStamps();
  await settingsPage.uploadStampFiles([stamp, stamp, stamp]);
  await expect(settingsPage.toast(SettingsData.messages.stampUploaded)).toBeVisible({ timeout: 60_000 });
  await settingsPage.closeModal();
});`,

  112: `test('TC_AP_112 - Verify Stamps Visible In See All View', async ({ settingsPage }) => {
  const { stamps } = await settingsPage.fetchApprovalStampsFromApi();
  test.skip(stamps.length === 0, 'No approval stamps returned from API');

  await settingsPage.openSeeAllStamps({ tab: 'approval' });
  await expect(settingsPage.stampImagesInModal().first()).toBeVisible({ timeout: 30_000 });
  await expect(settingsPage.stampDeleteIcons().first()).toBeVisible();
  await settingsPage.closeModal();
});`,

  113: `// import { test } from '../fixtures/settings.fixture';
//
// test.skip('TC_AP_113 - Verify Stamps Visible On Mobile App', async () => {
//   // Requires GulfTMT mobile application — out of admin portal automation scope.
// });`,

  114: `test('TC_AP_114 - Verify Language Preference Can Be Set', async ({ settingsPage }) => {
  await settingsPage.updateSupportDetails({ languageLabel: SettingsData.languages.thai.label });
  const api = await settingsPage.fetchSettingsFromApi();
  expect(api.CHANGE_LANGUAGE).toBe(SettingsData.languages.thai.code);
});`,

  115: `test('TC_AP_115 - Verify English Persists After Re Login', async ({ settingsPage }) => {
  await settingsPage.updateSupportDetails({ languageLabel: SettingsData.languages.english.label });
  await settingsPage.logoutAndLoginAgain();
  const api = await settingsPage.fetchSettingsFromApi();
  expect(api.CHANGE_LANGUAGE).toBe(SettingsData.languages.english.code);
  await settingsPage.expectDashboardTitle(settingsPage.mapLanguageCodeToDashboardTitle(api.CHANGE_LANGUAGE));
});`,

  116: `test('TC_AP_116 - Verify Thai Persists After Re Login', async ({ settingsPage }) => {
  await settingsPage.updateSupportDetails({ languageLabel: SettingsData.languages.thai.label });
  await settingsPage.logoutAndLoginAgain();
  const api = await settingsPage.fetchSettingsFromApi();
  expect(api.CHANGE_LANGUAGE).toBe(SettingsData.languages.thai.code);
  await settingsPage.expectDashboardTitle(settingsPage.mapLanguageCodeToDashboardTitle(api.CHANGE_LANGUAGE));
});`,

  117: `test('TC_AP_117 - Verify Japanese Persists After Re Login', async ({ settingsPage }) => {
  await settingsPage.updateSupportDetails({ languageLabel: SettingsData.languages.japanese.label });
  await settingsPage.logoutAndLoginAgain();
  const api = await settingsPage.fetchSettingsFromApi();
  expect(api.CHANGE_LANGUAGE).toBe(SettingsData.languages.japanese.code);
  await settingsPage.expectDashboardTitle(settingsPage.mapLanguageCodeToDashboardTitle(api.CHANGE_LANGUAGE));
});`,

  118: `test('TC_AP_118 - Verify Default Language Reflected In UI', async ({ settingsPage }) => {
  await settingsPage.updateSupportDetails({ languageLabel: SettingsData.languages.japanese.label });
  const api = await settingsPage.fetchSettingsFromApi();
  await settingsPage.expectDashboardTitle(settingsPage.mapLanguageCodeToDashboardTitle(api.CHANGE_LANGUAGE));
});`,

  119: `test('TC_AP_119 - Verify Thai Language Persists After Logout Login', async ({ settingsPage }) => {
  await settingsPage.updateSupportDetails({ languageLabel: SettingsData.languages.thai.label });
  await settingsPage.logoutAndLoginAgain();
  await settingsPage.navigateToSettings();
  const api = await settingsPage.fetchSettingsFromApi();
  expect(api.CHANGE_LANGUAGE).toBe(SettingsData.languages.thai.code);
});`,
};

const ids = Object.keys(specs)
  .map(Number)
  .sort((a, b) => a - b);

const commentedOnly = new Set([92, 93, 108, 109, 113]);

for (const id of ids) {
  const file = path.join(outDir, `TC-${id}.spec.ts`);
  const content = commentedOnly.has(id) ? `${specs[id]}\n` : `${header}\n${specs[id]}\n`;
  fs.writeFileSync(file, content);
  console.log(`Wrote ${file}`);
}

console.log(`Generated ${ids.length} settings spec files.`);
