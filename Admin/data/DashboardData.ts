export const DashboardData = {
  topBoxes: [
    'Mobile App Users',
    'HQ Members',
    'Users Can Delete',
    'Total Groups',
    'Admins',
  ],

  /** Current counts from GulfTMT dashboard (update if data changes). */
  expectedCounts: {
    mobileUsers: 261,
    hqMembers: 238,
    usersCanDelete: 37,
    totalGroups: 24,
    admins: 8,
  },

  vennCategories: ['Mobile App Users', 'HQ Members', 'Users Can Delete', 'Regular Users'],

  vennCounts: {
    mobileUsers: 261,
    hqMembers: 238,
    usersCanDelete: 37,
  },

  graphAxisLabels: {
    x: 'Group Name',
    y: 'Users Count',
  },

  graphTooltipFields: ['HQ Members', 'Users Can Delete', 'Regular Users'],

  barGraphFields: ['Regular Users', 'Users Can Delete', 'HQ Members'],

  /** Known groups visible on the bar chart. */
  sampleGroups: ['test-100', 'Dev Group', 'HQ Group', 'JOSH Group'],

  /**
   * Group with zero users — should not appear on graph (TC_AP_288).
   * Update if you know the exact empty group name in your environment.
   */
  emptyGroupName: 'EmptyGroupWithZeroUsers',

  mobileUsersPagePath: '/mobile-users',
  /** Table pagination format: "1-25 of 261 items" (see TableView showTotal). */
  mobileUsersPaginationPattern: /of\s*261\s*items/i,
};
