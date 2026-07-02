import { TestDataGenerator } from '../utils/TestDataGenerator';

export const AdminUsersData = {
  paths: {
    listing: '/admin-users',
    create: '/create-user',
  },

  pageTitle: 'Admin Users',
  createPageTitle: 'Create User',
  editPageTitle: 'Edit user details',

  languages: {
    english: 'English',
    thai: 'ภาษาไทย',
    japanese: '日本語',
  },

  doraku: {
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
    'Status',
    'Language',
    'Created On',
    'Actions',
  ] as const,

  pagination: {
    defaultPageSize: 25,
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
    invalidImageFormat: /Only JPG, PNG, and JPEG files are allowed/i,
    imageTooSmall: /File size is less than \d+ KB/i,
    imageTooLarge: /File size exceeds the limit of \d+ MB/i,
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
  },

  buildValidUser(overrides: Partial<ReturnType<typeof AdminUsersData.buildValidUser>> = {}) {
    return {
      firstName: TestDataGenerator.generateRandomName(),
      lastName: TestDataGenerator.generateRandomLastName(),
      userName: TestDataGenerator.generateUniqueUsername(),
      email: TestDataGenerator.generateUniqueEmail(),
      phone: '',
      language: AdminUsersData.languages.english,
      dorakuYes: false,
      statusActive: true,
      ...overrides,
    };
  },
};
