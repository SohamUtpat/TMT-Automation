export const loginData = {
  baseUrl: process.env.BASE_URL ?? 'http://18.142.102.68',

  validUser: process.env.VALID_USERNAME ?? 'soham05',
  validPassword: process.env.VALID_PASSWORD ?? 'Josh@123',

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
