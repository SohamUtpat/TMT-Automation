export const CategoriesData = {
  path: '/categories',
  createPath: '/create-category',
  pageTitle: 'Categories',
  createPageTitle: 'Create Category',
  editPageTitle: 'Edit Category',

  listHeaders: [
    'Category Name',
    'Description',
    'Assigned Group Count',
    'Created On',
    'Updated On',
    'Actions',
  ] as const,

  api: {
    defaultPage: 0,
    defaultSize: 20,
    defaultSearch: '',
    defaultSort: 'categoryOrder,asc',
  },

  validation: {
    nameRequired: /required|cannot be empty|enter category name|name is required|category name is required/i,
    nameDuplicate: /already exists|already exist|duplicate|unique|taken|same name|exists/i,
    nameSpecialChars: /required|special|invalid|not valid|alphanumeric|letters|name not valid/i,
    nameMaxLength: 50,
    nameTooLong: /maximum|max|too long|characters|length|required/i,
  },

  search: {
    placeholder: 'Search categories...',
    groupsPlaceholder: 'Search groups...',
    noMatchTerm: `NoCatMatch${Date.now()}`,
    emptySearch: /no categories match your search/i,
  },

  deleteModal: {
    confirmMessage: /are you sure you want to delete this category/i,
    confirmButton: 'Delete',
    blockedTitle: 'Cannot Delete Category',
    blockedMessage: /this category still has groups assigned/i,
    blockedHint: /unassign its groups|remove all assigned groups/i,
  },

  messages: {
    created: /category created successfully/i,
    updated: /category updated successfully/i,
    deleted: /category deleted successfully/i,
  },

  form: {
    nameLabel: 'Category Name',
    descriptionLabel: 'Description',
    groupsLabel: 'Assigned Groups',
    assignGroupsButton: 'Assign Groups',
    createButton: 'Create Category',
    cancelButton: 'Cancel',
    updateButton: 'Update Category',
    backLink: 'Back to Categories',
  },

  uniqueCategory(prefix = 'Cat') {
    const stamp = Date.now().toString().slice(-6);
    return {
      name: `${prefix}${stamp}`,
      description: `Auto category ${stamp}`,
    };
  },

  example: {
    sports: {
      name: 'Sports',
      description: 'Sports related groups',
      groups: ['Cricket', 'Football'],
    },
  },
};
