import { test, expect } from '../fixtures/settings.fixture';
import { SettingsData } from '../data/SettingsData';
import { TestDataGenerator } from '../utils/TestDataGenerator';

test('TC_AP_84 - Verify Support Fields Trim Spaces On Update', async ({ settingsPage, settingsBaseline }) => {
  const update = SettingsData.buildSupportUpdate();
  const languageLabel = settingsPage.mapLanguageCodeToLabel(settingsBaseline.CHANGE_LANGUAGE);

  await settingsPage.openSupportDetailsEdit();
  await settingsPage.fillSupportForm({
    // App validates before trim; patterns allow trailing spaces, then payload uses .trim().
    url: `${update.url}  `,
    email: `${update.email}  `,
    contact: `${update.contact}  `,
    languageLabel,
  });
  await settingsPage.submitSupportForm();

  await settingsPage.expectDisplayedSupportField(/URL/i, update.url);
  await settingsPage.expectDisplayedSupportField(/Email/i, update.email);
  await settingsPage.expectDisplayedSupportField(/Contact/i, update.contact);
});

test('TC_AP_85 - Verify Support Details Edit Form Opens', async ({ settingsPage }) => {
  await settingsPage.openSupportDetailsEdit();
  await expect(settingsPage.urlInput()).toBeVisible();
  await expect(settingsPage.emailInput()).toBeVisible();
  await expect(settingsPage.contactInput()).toBeVisible();
  await settingsPage.closeModal();
});

test('TC_AP_86 - Verify Support URL Is Clickable', async ({ settingsPage, settingsBaseline }) => {
  expect(settingsBaseline.url).toBeTruthy();

  const href = await settingsPage.supportUrlLink().getAttribute('href');
  expect(href).toBeTruthy();
  const host = settingsBaseline.url.replace(/^https?:\/\//, '').split('/')[0];
  expect(href!).toContain(host);

  // Destination may be down (e.g. local support URL) — only verify a new tab opens.
  const popup = await settingsPage.clickSupportUrlLink();
  expect(popup).toBeTruthy();
  await popup.close();
});

test('TC_AP_87 - Verify Support URL Is Updated', async ({ settingsPage, settingsBaseline }) => {
  const update = SettingsData.buildSupportUpdate();
  await settingsPage.updateSupportDetails({
    url: update.url,
    languageLabel: settingsPage.mapLanguageCodeToLabel(settingsBaseline.CHANGE_LANGUAGE),
  });
  await settingsPage.expectDisplayedSupportField(/URL/i, update.url);
});

test('TC_AP_88 - Verify Support Email Is Updated', async ({ settingsPage, settingsBaseline }) => {
  const update = SettingsData.buildSupportUpdate();
  await settingsPage.updateSupportDetails({
    email: update.email,
    languageLabel: settingsPage.mapLanguageCodeToLabel(settingsBaseline.CHANGE_LANGUAGE),
  });
  await settingsPage.expectDisplayedSupportField(/Email/i, update.email);
});

test('TC_AP_89 - Verify Default Language Is Updated In Settings', async ({ settingsPage }) => {
  await settingsPage.selectLanguageInEditModal(SettingsData.languages.thai.label);
  await settingsPage.closeModal();
});

test('TC_AP_90 - Verify Settings Default Language On Create User Page', async ({ settingsPage }) => {
  await settingsPage.updateSupportDetails({ languageLabel: SettingsData.languages.japanese.label });
  await settingsPage.expectCreateUserDefaultLanguage(SettingsData.languages.japanese.label);
});

test('TC_AP_91 - Verify Contact Details Are Updated', async ({ settingsPage, settingsBaseline }) => {
  const update = SettingsData.buildSupportUpdate();
  await settingsPage.updateSupportDetails({
    contact: update.contact,
    languageLabel: settingsPage.mapLanguageCodeToLabel(settingsBaseline.CHANGE_LANGUAGE),
  });
  await settingsPage.expectDisplayedSupportField(/Contact/i, update.contact);
});

test('TC_AP_94 - Verify Only Valid URL Format Accepted', async ({ settingsPage }) => {
  await settingsPage.openSupportDetailsEdit();
  await settingsPage.fillSupportForm({ url: 'not-a-valid-url' });
  await settingsPage.submitSupportForm({ waitForSuccess: false });
  await settingsPage.expectValidationMessage(SettingsData.validation.invalidUrl);
  await settingsPage.closeModal();
});

test('TC_AP_95 - Verify Contact Number Maximum Length 15', async ({ settingsPage, settingsBaseline }) => {
  const contact = '1'.repeat(15);
  await settingsPage.updateSupportDetails({
    contact,
    languageLabel: settingsPage.mapLanguageCodeToLabel(settingsBaseline.CHANGE_LANGUAGE),
  });
  await settingsPage.expectDisplayedSupportField(/Contact/i, contact);
});

test('TC_AP_96 - Verify Contact Over 15 Shows Validation', async ({ settingsPage }) => {
  await settingsPage.openSupportDetailsEdit();
  await settingsPage.fillSupportForm({ contact: '1'.repeat(16) });
  await settingsPage.submitSupportForm({ waitForSuccess: false });
  await settingsPage.expectValidationMessage(SettingsData.validation.contactLength);
  await settingsPage.closeModal();
});

test('TC_AP_97 - Verify Contact Rejects Invalid Characters', async ({ settingsPage }) => {
  await settingsPage.openSupportDetailsEdit();
  await settingsPage.fillSupportForm({ contact: TestDataGenerator.generateInvalidPhone() });
  await settingsPage.submitSupportForm({ waitForSuccess: false });
  await settingsPage.expectValidationMessage(SettingsData.validation.invalidContact);
  await settingsPage.closeModal();
});

test('TC_AP_98 - Verify Invalid Data Cannot Be Saved', async ({ settingsPage }) => {
  await settingsPage.openSupportDetailsEdit();
  await settingsPage.fillSupportForm({
    url: 'bad-url',
    email: TestDataGenerator.generateInvalidEmail(),
    contact: 'abc',
  });
  await settingsPage.submitSupportForm({ waitForSuccess: false });
  await expect(settingsPage.settingsModal()).toBeVisible();
  await settingsPage.closeModal();
});

test('TC_AP_99 - Verify Support And Stamp Fields On Settings Page', async ({ settingsPage }) => {
  const apiSettings = await settingsPage.fetchSettingsFromApi();
  const { total: approvalTotal } = await settingsPage.fetchApprovalStampsFromApi();

  for (const field of SettingsData.supportFields) {
    await expect(settingsPage.supportDetailsSection().getByText(field, { exact: false })).toBeVisible();
  }
  for (const field of SettingsData.languageFields) {
    await expect(settingsPage.defaultLanguageSection().getByText(field, { exact: false })).toBeVisible();
  }
  expect(apiSettings.url).toBeTruthy();
  expect(apiSettings.email).toBeTruthy();

  await expect(settingsPage.stampsSection()).toBeVisible();
  await expect(settingsPage.seeAllStampsButton()).toBeVisible();
  await expect(settingsPage.uploadNewStampButton()).toBeVisible();
  expect(approvalTotal).toBeGreaterThanOrEqual(0);

  await settingsPage.openSeeAllStamps();
  await expect(settingsPage.settingsModal().getByText(SettingsData.stamps.modalTitle)).toBeVisible();
  await settingsPage.closeModal();
});

test('TC_AP_100 - Verify Stamps Can Be Viewed', async ({ settingsPage }) => {
  const { stamps: approvalStamps } = await settingsPage.fetchApprovalStampsFromApi();
  expect(approvalStamps.length, 'No approval stamps returned from API').toBeGreaterThan(0);

  await expect(settingsPage.stampPreviewImages().first()).toBeVisible({ timeout: 30_000 });

  await settingsPage.openSeeAllStamps();
  expect(await settingsPage.stampImagesInModal().count()).toBeGreaterThan(0);
  await settingsPage.closeModal();
});

test('TC_AP_101 - Verify Stamp Can Be Deleted', async ({ settingsPage }) => {
  const { stamps } = await settingsPage.fetchApprovalStampsFromApi();
  expect(stamps.length, 'No approval stamps available from API to delete').toBeGreaterThan(0);

  await settingsPage.openSeeAllStamps();
  await settingsPage.deleteFirstStampInModal();
  await settingsPage.closeModal();
});

test('TC_AP_102 - Verify Message After Stamp Deletion', async ({ settingsPage }) => {
  const { stamps } = await settingsPage.fetchApprovalStampsFromApi();
  expect(stamps.length, 'No approval stamps available from API to delete').toBeGreaterThan(0);

  await settingsPage.openSeeAllStamps();
  await settingsPage.deleteFirstStampInModal();
  await expect(settingsPage.toast(SettingsData.messages.stampDeleted)).toBeVisible();
  await settingsPage.closeModal();
});

test('TC_AP_103 - Verify Upload Option For New Stamps', async ({ settingsPage }) => {
  await settingsPage.openUploadStamps();
  await expect(settingsPage.uploadButton()).toBeVisible();
  await expect(settingsPage.stampUploadInput()).toBeAttached();
  await settingsPage.closeModal();
});

test('TC_AP_104 - Verify Stamp Upload Accepts Jpg Png Jpeg', async ({ settingsPage }) => {
  await settingsPage.openUploadStamps();
  await expect(settingsPage.page.getByText(/JPG|PNG|JPEG/i).first()).toBeVisible();
  await settingsPage.closeModal();
});

test('TC_AP_105 - Verify Invalid Stamp Format Shows Error', async ({ settingsPage }) => {
  await settingsPage.openUploadStamps();
  await settingsPage.uploadStampFiles([SettingsData.testAssets.invalidPdf]);
  await settingsPage.expectValidationMessage(SettingsData.validation.invalidStampFormat);
  await settingsPage.closeModal();
});

test('TC_AP_106 - Verify Multiple Stamps Can Be Uploaded', async ({ settingsPage }) => {
  const stamp = SettingsData.testAssets.validStamp;
  await settingsPage.openUploadStamps();
  await settingsPage.uploadStampFiles([stamp, stamp]);
  await expect(settingsPage.toast(SettingsData.messages.stampUploaded)).toBeVisible({ timeout: 60_000 });
  await settingsPage.closeModal();
});

test('TC_AP_107 - Verify More Than 50 Stamps Cannot Upload At Once', async ({ settingsPage }) => {
  const stamp = SettingsData.testAssets.validStamp;
  const files = Array.from({ length: 51 }, () => stamp);
  await settingsPage.openUploadStamps();
  await settingsPage.uploadStampFiles(files);
  await settingsPage.expectValidationMessage(SettingsData.validation.maxStampBatch);
  await settingsPage.closeModal();
});

test('TC_AP_110 - Verify User Can Add Stamp', async ({ settingsPage }) => {
  await settingsPage.openUploadStamps();
  await settingsPage.uploadStampFiles([SettingsData.testAssets.validStamp]);
  await expect(settingsPage.toast(SettingsData.messages.stampUploaded)).toBeVisible({ timeout: 60_000 });
  await settingsPage.closeModal();
});

test('TC_AP_111 - Verify User Can Add Multiple Stamps', async ({ settingsPage }) => {
  const stamp = SettingsData.testAssets.validStamp;
  await settingsPage.openUploadStamps();
  await settingsPage.uploadStampFiles([stamp, stamp, stamp]);
  await expect(settingsPage.toast(SettingsData.messages.stampUploaded)).toBeVisible({ timeout: 60_000 });
  await settingsPage.closeModal();
});

test('TC_AP_112 - Verify Stamps Visible In See All View', async ({ settingsPage }) => {
  const { stamps } = await settingsPage.fetchApprovalStampsFromApi();
  expect(stamps.length, 'No approval stamps returned from API').toBeGreaterThan(0);

  await settingsPage.openSeeAllStamps();
  await expect(settingsPage.stampImagesInModal().first()).toBeVisible({ timeout: 30_000 });
  await expect(settingsPage.stampDeleteIcons().first()).toBeVisible();
  await settingsPage.closeModal();
});

test('TC_AP_114 - Verify Language Preference Can Be Set', async ({ settingsPage }) => {
  await settingsPage.selectLanguageInEditModal(SettingsData.languages.thai.label);
  await settingsPage.closeModal();
});

test('TC_AP_115 - Verify English Language Is Selectable On Settings UI', async ({ settingsPage }) => {
  await settingsPage.selectLanguageInEditModal(SettingsData.languages.english.label);
  await settingsPage.closeModal();
});

test('TC_AP_116 - Verify Thai Language Is Selectable On Settings UI', async ({ settingsPage }) => {
  await settingsPage.selectLanguageInEditModal(SettingsData.languages.thai.label);
  await settingsPage.closeModal();
});

test('TC_AP_117 - Verify Japanese Language Is Selectable On Settings UI', async ({ settingsPage }) => {
  await settingsPage.selectLanguageInEditModal(SettingsData.languages.japanese.label);
  await settingsPage.closeModal();
});

test('TC_AP_118 - Verify Default Language Options Reflected In UI', async ({ settingsPage }) => {
  await settingsPage.selectLanguageInEditModal(SettingsData.languages.japanese.label);
  await settingsPage.closeModal();
  await settingsPage.selectLanguageInEditModal(SettingsData.languages.english.label);
  await settingsPage.closeModal();
});

test('TC_AP_119 - Verify Thai Language Remains Selectable On Settings Page', async ({ settingsPage }) => {
  await settingsPage.selectLanguageInEditModal(SettingsData.languages.thai.label);
  await settingsPage.closeModal();
  await settingsPage.ensureSettingsReady();
  await settingsPage.selectLanguageInEditModal(SettingsData.languages.thai.label);
  await settingsPage.closeModal();
});
