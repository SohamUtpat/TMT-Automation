export const DashboardData = {
  topBoxes: [
    'Mobile App Users',
    'HQ Members',
    'Users Can Delete',
    'Total Groups',
    'Admins',
  ],

  vennCategories: ['Mobile App Users', 'HQ Members', 'Users Can Delete', 'Regular Users'],

  graphAxisLabels: {
    x: 'Group Name',
    y: 'Users Count',
  },

  graphTooltipFields: ['HQ Members', 'Users Can Delete', 'Regular Users'],

  barGraphFields: ['Regular Users', 'Users Can Delete', 'HQ Members'],

  /** Known groups visible on the bar chart (smoke reference only). */
  sampleGroups: ['test-100', 'Dev Group', 'HQ Group', 'JOSH Group'],

  /**
   * Fallback empty-group name for TC_AP_288 when the API returns no zero-user groups.
   * Prefer `getApiEmptyGroupNames()` so the assertion tracks live data.
   */
  emptyGroupName: 'EmptyGroupWithZeroUsers',

  mobileUsersPagePath: '/mobile-users',

  /** Build pagination matcher from live Mobile App Users API count (TC_AP_286). */
  mobileUsersPaginationPattern(count: number): RegExp {
    const escaped = String(count).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`of\\s*${escaped}\\s*items`, 'i');
  },
};
