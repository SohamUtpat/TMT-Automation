export const ChangeLanguageData = {
  path: '/profile/change-language',

  pages: [
    { path: '/dashboard', title: 'Dashboard' },
    { path: '/groups', title: 'Groups' },
    { path: '/mobile-users', title: 'Mobile Users' },
    { path: '/admin-users', title: 'Admin Users' },
    { path: '/settings', title: 'Settings' },
  ],

  buttons: {
    changeLanguage: 'Change Language',
    confirmLanguage: 'Confirm Language',
    back: 'Back',
    yes: 'Yes',
    cancel: 'Cancel',
  },

  languages: {
    english: {
      label: 'English',
      code: 'eng',
      dashboardTitle: 'Dashboard',
      changeLanguagePageTitle: 'Change Language',
      confirmButton: 'Confirm Language',
      successToast: /language updated successfully/i,
    },
    thai: {
      label: 'ภาษาไทย',
      code: 'thai',
      dashboardTitle: 'เมนู - แดชบอร์ด',
      changeLanguagePageTitle: 'เปลี่ยนภาษา',
      confirmButton: 'ยืนยันภาษา',
      successToast: /language updated successfully|อัปเดตภาษา/i,
    },
    japanese: {
      label: '日本語',
      code: 'jpn',
      dashboardTitle: 'メニュー - ダッシュボード',
      changeLanguagePageTitle: '言語変更',
      confirmButton: '言語を確認',
      successToast: /language updated successfully|言語.*更新/i,
    },
  },

  languageLabels: ['English', 'ภาษาไทย', '日本語'] as const,

  messages: {
    updateConfirmation: /sure you want to update the language/i,
    languageUpdated: /language updated successfully|อัปเดตภาษา|言語.*更新/i,
  },
};
