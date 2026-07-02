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
    'Approver',
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
    bulkDorakuMax: 10,
    passwordMin: 8,
    passwordMax: 15,
    bulkUploadMaxRecords: 30_000,
    bulkUploadBatchSize: 1_000,
  },

  bulkUpload: {
    pageHeading: 'Bulk Upload',
    historyPageTitle: 'Bulk Upload History',
    templateFileName: 'Bulk_Upload_Template.csv',

    historyColumns: [
      'File Name',
      'Download File',
      'Uploaded On',
      'Current Status',
      'Success Records',
      'Failed Records',
      'Download Error Report',
    ] as const,

    /** Rules shown on the bulk upload page — used by TC_AP_273 / TC_AP_274. */
    rules: [
      'Only .csv file format is supported.',
      'Maximum records should be 30000.',
      'Username should be unique.',
      'Acceptance criteria for the username is a combination of: alphabets, numbers, dashes, and underscores.',
      'The username can have a maximum of 50 characters and a minimum of 3 characters.',
      'Maximum character limit for first name and last name is 50 characters.',
      'Enter a valid email address.',
      'Enter a valid mobile number.',
      'Values in the language field should be either eng or thai or jpn.',
      'Groups can accept multiple groups separated by a comma',
      'Roles accept comma separated values',
      'The Doraku code field accepts maximum 10 alphanumeric characters',
      'The Mobile, Doraku code, Group, and Profile photo fields are optional',
    ] as const,

    /** Field guidance from TC_AP_273 manual steps. */
    fieldRules: [
      { label: 'valid email', pattern: /valid email/i },
      { label: 'valid mobile number', pattern: /valid mobile number/i },
      { label: 'language eng thai jpn', pattern: /eng or thai or jpn/i },
      { label: 'mobile optional', pattern: /Mobile, Doraku code.*optional/i },
      { label: 'groups comma separated', pattern: /Groups can accept multiple groups/i },
      { label: 'roles comma separated', pattern: /Roles accept comma separated values/i },
      { label: 'csv only', pattern: /Only \.csv file format is supported/i },
      { label: 'max 30000 records', pattern: /Maximum records should be 30000/i },
      { label: 'username unique', pattern: /Username should be unique/i },
      { label: 'first last name max 50', pattern: /first name and last name is 50 characters/i },
      { label: 'username min 3 max 50', pattern: /minimum of 3 characters/i },
      { label: 'username pattern', pattern: /alphabets, numbers, dashes, and underscores/i },
      { label: 'doraku max 10', pattern: /maximum 10 alphanumeric characters/i },
    ] as const,

    messages: {
      processed: /Bulk upload processed successfully/i,
      csvOnly: 'Only CSV files are allowed!',
      selectFile: 'Please select a file to upload',
      overBatchLimit: /1000|exceed.*1000|more than 1000/i,
      overMaxRecords: /30000|exceed.*30000|more than 30000/i,
    },
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
