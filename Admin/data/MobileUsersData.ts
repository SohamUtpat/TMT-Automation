import { TestDataGenerator } from '../utils/TestDataGenerator';

export const MobileUsersData = {
  paths: {
    listing: '/mobile-users',
    create: '/create-mobile-user',
    bulkUpload: '/bulk-upload',
    bulkUploadHistory: '/bulk-upload-history',
  },

  pageTitle: 'Mobile Users',
  createPageTitle: 'Create User',
  editPageTitle: 'Edit user details',

  hqGroupCode: 'HQ',
  hqGroupName: 'HQ Group',

  languages: {
    english: 'English',
    thai: 'ภาษาไทย',
    japanese: '日本語',
  },

  roles: {
    yes: 'Yes',
    no: 'No',
  },

  status: {
    active: 'Active',
    inactive: 'Inactive',
  },

  listingColumns: [
    'Username',
    'Name',
    'Email',
    'Groups',
    'Delete Message',
    'Role HQ',
    'Status',
    'Language',
    'Created On',
    'Actions',
  ] as const,

  pagination: {
    defaultPageSize: 25,
    pageSizePattern: /\d+-\d+ of \d+ items/,
  },

  validation: {
    required: 'Required',
    invalidFirstName: 'Invalid first name',
    invalidLastName: 'Invalid last name',
    firstNameMaxLength: 'The length of first name must be maximum 50',
    lastNameMaxLength: 'The length of last name must be maximum 50',
    usernameLength: 'The length of username must be minimum 3 and maximum 50',
    usernamePattern: 'Only alphabets, numbers, dashes and underscores are allowed',
    invalidEmail: 'Enter a valid email',
    emailMaxLength: 'The length of email must be maximum 350',
    mobileMaxLength: 'The length of mobile number must be maximum 15',
    invalidMobile: 'Enter a valid mobile number',
    dorakuMaxLength: 'The length of Doraku code must be maximum 20',
    invalidDoraku: 'Invalid doraku code',
    passwordLength: '8-15 characters',
    passwordPattern:
      'At least one special character, one number, one lowercase letter, and one uppercase letter required',
    invalidImageFormat: /Only JPG, PNG, and JPEG files are allowed/i,
    imageTooSmall: /File size is less than \d+ KB/i,
    imageTooLarge: /File size exceeds the limit of \d+ MB/i,
    bulkCsvOnly: 'Only CSV files are allowed!',
    bulkUploadRequired: 'Please select a file to upload',
  },

  messages: {
    userSaved: 'User saved successfully',
    userDeleted: 'User deleted successfully',
    userInactivated: 'User inactivated successfully',
    deleteConfirm: 'Are you sure you want to delete user?',
    inactivateConfirm: 'Are you sure you want to inactivate user?',
  },

  testAssets: {
    validPng: 'Admin/test-assets/valid-photo.png',
    tinyPng: 'Admin/test-assets/tiny.png',
    invalidPdf: 'Admin/test-assets/invalid.pdf',
  },

  limits: {
    nameMax: 50,
    lastNameMax: 50,
    usernameMin: 3,
    usernameMax: 50,
    mobileMax: 15,
    dorakuMax: 20,
    passwordMin: 8,
    passwordMax: 15,
  },

  /** Builds a fully valid mobile user payload with unique fields. */
  buildValidUser(overrides: Partial<ReturnType<typeof MobileUsersData.buildValidUser>> = {}) {
    return {
      firstName: TestDataGenerator.generateRandomName(),
      lastName: TestDataGenerator.generateRandomLastName(),
      userName: TestDataGenerator.generateUniqueUsername(),
      email: TestDataGenerator.generateUniqueEmail(),
      password: TestDataGenerator.generateValidPassword(),
      phone: '',
      language: MobileUsersData.languages.english,
      deleteMsgYes: false,
      roleHqYes: false,
      ...overrides,
    };
  },
};
