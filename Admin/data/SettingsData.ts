import { TestDataGenerator } from '../utils/TestDataGenerator';

export const SettingsData = {
  path: '/settings',
  pageTitle: 'Settings',

  languages: {
    english: {
      label: 'English',
      code: 'eng',
      dashboardTitle: 'Dashboard',
      settingsTitle: 'Settings',
      displayedLabel: 'English',
    },
    thai: {
      label: 'ภาษาไทย',
      code: 'thai',
      dashboardTitle: 'เมนู - แดชบอร์ด',
      settingsTitle: 'ตั้งค่า',
      // Settings list renders i18next.t('thai') while admin UI stays English.
      displayedLabel: 'แบบไทย',
    },
    japanese: {
      label: '日本語',
      code: 'jpn',
      dashboardTitle: 'メニュー - ダッシュボード',
      settingsTitle: '設定',
      displayedLabel: '日本語',
    },
  },

  supportFields: ['URL', 'Email', 'Contact Details', 'Language'] as const,

  stamps: {
    api: { version: 2, page: 0, size: 25 },
    types: { standard: 0, approval: 1 },
    tabs: { standard: 'Standard Stamps', approval: 'Approval Stamps' },
  },

  limits: {
    contactMax: 15,
    maxStampUploadBatch: 50,
    totalStampMax: 100,
  },

  validation: {
    invalidUrl: 'Invalid URL',
    invalidEmail: 'Invalid email',
    invalidContact: /invalid contact/i,
    contactLength: /maximum 15/i,
    contactRequired: /cannot be empty/i,
    invalidStampFormat: /Only JPG, PNG, and JPEG files are allowed/i,
    maxStampBatch: /Maximum file limit has been reached - 50/i,
    totalStampLimit: /More than 100 stamps not allowed/i,
  },

  messages: {
    saved: /Data saved successfully|更新完了|อัปเดตแล้ว/i,
    stampDeleted: /Stamp deleted successfully|スタンプが削除されました|แสตมป์ถูกลบแล้ว/i,
    stampUploaded: /stamp uploaded successfully/i,
  },

  testAssets: {
    validStamp: 'Admin/test-assets/valid-stamp.png',
    tinyPng: 'Admin/test-assets/tiny.png',
    invalidPdf: 'Admin/test-assets/invalid.pdf',
  },

  buildSupportUpdate(overrides: Partial<ReturnType<typeof SettingsData.buildSupportUpdate>> = {}) {
    const suffix = Date.now();
    return {
      url: `https://support-${suffix}.example.com`,
      email: `support_${suffix}@example.com`,
      contact: `9${String(suffix).slice(-9).padStart(9, '0')}`,
      language: SettingsData.languages.english.code,
      ...overrides,
    };
  },

  buildValidUrl() {
    return `https://support-${TestDataGenerator.generateUniqueUsername()}.example.com`;
  },
};
