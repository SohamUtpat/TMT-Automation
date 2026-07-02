export const FormsData = {
  path: '/forms',
  formBuilderPath: '/form-builder',
  formSubmissionsPath: '/form-submissions',
  pageTitle: 'Forms',

  tableColumns: ['Form Name', 'Description', 'Created On', 'Updated On', 'Actions'] as const,

  api: {
    listPath: '/form/get/forms',
    defaultPage: 0,
    defaultSize: 10,
    defaultSort: 'dateCreated,DESC',
    defaultSearch: '',
  },

  assignModal: {
    titlePattern: /Assign Groups/i,
    selectGroupsLabel: /Search and select groups/i,
    saveButton: /^save$/i,
    cancelButton: /^cancel$/i,
    noDataFound: /no data found|no groups found/i,
  },

  messages: {
    groupsAssigned: /group(s)? assigned|updated successfully/i,
  },

  invalidSearchTerm: 'zzzxxyyynoformmatch999',
};
