import { getBaseUrl } from '../config/appConfig';

export const loginData = {
  baseUrl: getBaseUrl(),

  // Temporary credentials — revert to soham05 / Josh@123 when the main account is restored.
  validUser: process.env.VALID_USERNAME ?? 'ADMIN',
  validPassword: process.env.VALID_PASSWORD ?? 'ADMIN',

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
