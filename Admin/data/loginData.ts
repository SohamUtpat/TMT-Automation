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
  usernameRequiredMessage: 'Username is required',
  passwordRequiredMessage: 'Password is required',
};
