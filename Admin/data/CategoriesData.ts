export const CategoriesData = {
  path: '/categories',
  pageTitle: 'Categories',
  createPageTitle: 'Create Category',
  editPageTitle: 'Edit Category',

  sortColumns: ['Name', 'Created On', 'Updated On'] as const,

  api: {
    defaultPage: 0,
    defaultSize: 25,
    defaultSearch: '',
    defaultSort: 'createdAt,desc',
  },

  validation: {
    nameRequired: /required|cannot be empty|enter category name/i,
  },

  deleteModal: {
    confirmTitle: /delete category|are you sure/i,
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
    groupsPlaceholder: 'Select groups',
    createButton: 'Create',
    cancelButton: 'Cancel',
    updateButton: 'Update',
    backLink: 'Back',
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
