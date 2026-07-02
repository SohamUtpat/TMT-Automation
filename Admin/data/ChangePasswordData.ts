import { TestDataGenerator } from '../utils/TestDataGenerator';

export const ChangePasswordData = {
  path: '/profile/change-password',

  pages: [
    { path: '/dashboard', title: 'Dashboard' },
    { path: '/groups', title: 'Groups' },
    { path: '/mobile-users', title: 'Mobile Users' },
    { path: '/admin-users', title: 'Admin Users' },
    { path: '/settings', title: 'Settings' },
  ],

  buttons: {
    changePassword: 'Change Password',
    confirmNewPassword: 'Confirm New Password',
  },

  validation: {
    enterValidPassword: 'Need a valid password',
    passwordPolicy:
      'At least one special character, one number, one lowercase letter, and one uppercase letter required',
    passwordLength: '8-15 characters',
    passwordsDoNotMatch: 'Passwords do not match',
    fillConfirmPassword: 'Please fill confirm password',
    sameAsOldPassword: /not be same as previous one/i,
    incorrectOldPassword: /invalid|incorrect|password/i,
  },

  messages: {
    passwordUpdated: /password.*success|updated successfully/i,
    updateConfirmation: /sure you want to change the password/i,
  },

  buildTestAdminUser() {
    const password = TestDataGenerator.generateValidPassword();
    return {
      firstName: TestDataGenerator.generateRandomName(),
      lastName: TestDataGenerator.generateRandomLastName(),
      userName: TestDataGenerator.generateUniqueUsername(),
      email: TestDataGenerator.generateUniqueEmail(),
      phone: '',
      languagePreference: 'eng',
      password,
    };
  },

  buildAlternatePassword(current: string): string {
    let next = TestDataGenerator.generateValidPassword();
    while (next === current) {
      next = TestDataGenerator.generateValidPassword();
    }
    return next;
  },
};
