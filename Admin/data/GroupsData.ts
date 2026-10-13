export const GroupsData = {
  pageTitle: 'Groups',

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
    // UI uses a curly apostrophe (’) in "can't" — match either quote style + trailing period.
    blockedMessage: /User can['\u2019]t delete this group as there are users in this group\./,
    blockedHint: 'Please remove all users from this group, and then you can delete this group',
    blockedOkButton: 'OK',
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

  /**
   * Build a unique name/code pair for create flows.
   * Code max is 15 chars — keep prefix short (≤4) so the stamp still fits.
   * Uses 8-digit time + 3-digit random so stamps don't collide every ~16 minutes
   * (the old 6-digit Date.now() slice recycled that often and broke create+search).
   */
  uniqueGroup(prefix: string) {
    const stamp = `${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')}`;
    const safePrefix = prefix.slice(0, 4);
    return {
      name: `${safePrefix}${stamp}`.slice(0, 50),
      code: `${safePrefix}${stamp}`.slice(0, 15),
    };
  },
};
