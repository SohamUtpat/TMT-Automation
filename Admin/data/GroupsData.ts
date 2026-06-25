export const GroupsData = {
  pageTitle: 'Groups',

  hqGroup: {
    name: 'HQ Group',
    code: 'HQ',
  },

  /** Group with members — used for members-list and single remove-user tests. */
  groupWithMembers: {
    name: 'Test--4June',
    code: 'Hi',
  },

  /** Large stable group for multi-member removal (TC-155). */
  groupForMultiMemberRemoval: {
    name: 'HQ Group',
    code: 'HQ',
  },

  /** Group with many members and a delete button — used for delete-blocked test. */
  groupForDeleteBlocked: {
    name: 'TestingQA group',
    code: '123',
  },

  /** Group with zero members — used for successful delete tests. */
  emptyGroup: {
    name: 'Production group',
    code: 'Production group',
  },

  search: {
    byName: 'HQ Group',
    byCode: 'HQ',
  },

  sortColumns: ['Name', 'Code', 'Created On'] as const,

  validation: {
    nameMinLengthMessage: 'The length of name must be minimum 2 and maximum 50',
    codeMinLengthMessage: 'The length of code must be minimum 2 and maximum 15',
    nameSpecialCharsMessage: 'Name not valid',
    codeSpecialCharsMessage: 'Code not valid',
    nameMaxLength: 50,
    codeMaxLength: 15,
    nameMinLength: 2,
    codeMinLength: 2,
    invalidImageFormat: /Only JPG, PNG, and JPEG files are allowed/i,
    imageTooSmall: /File size is less than \d+ KB/i,
    imageTooLarge: /File size exceeds the limit of \d+ MB/i,
    duplicateName: /already exists|duplicate|unique/i,
    duplicateCode: /already exists|duplicate|unique/i,
  },

  deleteModal: {
    confirmTitle: 'Are you sure you want to delete group?',
    blockedTitle: 'Delete Group',
    blockedMessage: /User can.t delete this group as there are users in this group/i,
    blockedHint: 'Please remove all users from this group, and then you can delete this group',
  },

  createModal: {
    title: 'Create New Group',
    nameLabel: 'Name',
    codeLabel: 'Code',
    createButton: 'Create',
    cancelButton: 'Cancel',
  },

  editModal: {
    title: 'Edit Group Details',
    updateButton: 'Update',
    cancelButton: 'Cancel',
  },

  membersPage: {
    removeUsersButton: 'Remove Users',
    searchPlaceholder: 'Search',
    selectAll: 'Select All',
  },

  testAssets: {
    validPng: 'Admin/test-assets/valid-photo.png',
    tinyPng: 'Admin/test-assets/tiny.png',
    largeJpg: 'Admin/test-assets/large.jpg',
    invalidPdf: 'Admin/test-assets/invalid.pdf',
    replacePng: 'Admin/test-assets/replace-photo.png',
  },

  uniqueGroup(prefix: string) {
    const stamp = Date.now().toString().slice(-6);
    return {
      name: `${prefix}${stamp}`,
      code: `${prefix}${stamp}`,
    };
  },
};
