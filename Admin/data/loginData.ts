import { getBaseUrl } from '../config/appConfig';

export const loginData = {
  get baseUrl() {
    return getBaseUrl();
  },

  // Admin portal credentials (override with VALID_USERNAME / VALID_PASSWORD env vars).
  validUser: process.env.VALID_USERNAME ?? 'ADMIN',
  validPassword: process.env.VALID_PASSWORD ?? 'Test@123',

  invalidUser: 'invalidUser',
  invalidPassword: 'Wrong@123',
  userNotPresent: 'UserNotPresent123',

  longUserName: 'verylongusernameverylongusernameverylongusername',
  longPassword: 'VeryLongPassword12345678901234567890@#$%',

  mobileUser: process.env.MOBILE_USERNAME ?? 'mobileuser',
  mobilePassword: process.env.MOBILE_PASSWORD ?? 'mobilepassword',

  invalidCredentialsMessage: 'Invalid username or password',
  // UMS also returns this for a known user + wrong password; FE may show it until rebuilt.
  invalidCredentialsMessages: [
    'Invalid username or password',
    'Please provide the correct username or password.',
  ],
  usernameRequiredMessage: 'Username is required',
  passwordRequiredMessage: 'Password is required',

  // App product default is Japanese; login specs assert English copy.
  // Must match frontend `LANGUAGE_STORAGE_KEY` / `ENG_LANG` (automation-only).
  languageStorageKey: 'gulf_net_admin-language',
  englishLanguageCode: 'eng',
  englishLanguageButtonLabel: 'English',
  englishUsernamePlaceholder: 'Enter Here',
};
