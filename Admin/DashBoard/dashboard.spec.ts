import { test, expect } from '../fixtures/dashboard.fixture';
import { DashboardData } from '../data/DashboardData';

test('TC_AP_280 - Verify Dashboard Top Boxes', async ({ dashboardPage }) => {
  for (const label of DashboardData.topBoxes) {
    await expect(dashboardPage.topBox(label)).toBeVisible();
    await expect(dashboardPage.topBox(label).locator('p.value')).toBeVisible();
  }
});

test('TC_AP_281 - Verify Dashboard Counts Match Actual Data', async ({ dashboardPage }) => {
  const [apiMobileUsers, apiHqMembers, apiUsersCanDelete, apiGroups, apiAdmins] =
    await Promise.all([
      dashboardPage.getApiMobileUsersCount(),
      dashboardPage.getApiHqMembersCount(),
      dashboardPage.getApiUsersCanDeleteCount(),
      dashboardPage.getApiGroupsCount(),
      dashboardPage.getApiAdminsCount(),
    ]);

  expect(await dashboardPage.getTopBoxCount('Mobile App Users')).toBe(apiMobileUsers);
  expect(await dashboardPage.getTopBoxCount('HQ Members')).toBe(apiHqMembers);
  expect(await dashboardPage.getTopBoxCount('Users Can Delete')).toBe(apiUsersCanDelete);
  expect(await dashboardPage.getTopBoxCount('Total Groups')).toBe(apiGroups);
  expect(await dashboardPage.getTopBoxCount('Admins')).toBe(apiAdmins);
});

test('TC_AP_282 - Verify Counts Stay Consistent After Refresh', async ({ dashboardPage }) => {
  const before = {
    mobileUsers: await dashboardPage.getTopBoxCount('Mobile App Users'),
    hqMembers: await dashboardPage.getTopBoxCount('HQ Members'),
    usersCanDelete: await dashboardPage.getTopBoxCount('Users Can Delete'),
    groups: await dashboardPage.getTopBoxCount('Total Groups'),
    admins: await dashboardPage.getTopBoxCount('Admins'),
  };

  const apiBefore = {
    mobileUsers: await dashboardPage.getApiMobileUsersCount(),
    hqMembers: await dashboardPage.getApiHqMembersCount(),
    usersCanDelete: await dashboardPage.getApiUsersCanDeleteCount(),
    groups: await dashboardPage.getApiGroupsCount(),
    admins: await dashboardPage.getApiAdminsCount(),
  };

  expect(before).toEqual(apiBefore);
  expect(before.mobileUsers).toBeGreaterThan(0);

  await dashboardPage.refreshDashboard();

  const after = {
    mobileUsers: await dashboardPage.getTopBoxCount('Mobile App Users'),
    hqMembers: await dashboardPage.getTopBoxCount('HQ Members'),
    usersCanDelete: await dashboardPage.getTopBoxCount('Users Can Delete'),
    groups: await dashboardPage.getTopBoxCount('Total Groups'),
    admins: await dashboardPage.getTopBoxCount('Admins'),
  };

  const apiAfter = {
    mobileUsers: await dashboardPage.getApiMobileUsersCount(),
    hqMembers: await dashboardPage.getApiHqMembersCount(),
    usersCanDelete: await dashboardPage.getApiUsersCanDeleteCount(),
    groups: await dashboardPage.getApiGroupsCount(),
    admins: await dashboardPage.getApiAdminsCount(),
  };

  expect(after).toEqual(apiAfter);
  expect(after).toEqual(before);
});

test('TC_AP_285 - Verify Venn Diagram Counts', async ({ dashboardPage }) => {
  await expect(dashboardPage.vennDiagram()).toBeVisible();

  const [apiMobileUsers, apiHqMembers, apiUsersCanDelete] = await Promise.all([
    dashboardPage.getApiMobileUsersCount(),
    dashboardPage.getApiHqMembersCount(),
    dashboardPage.getApiUsersCanDeleteCount(),
  ]);

  const vennText = await dashboardPage.vennDiagram().innerText();

  for (const category of DashboardData.vennCategories) {
    expect(vennText).toContain(category);
  }

  expect(dashboardPage.countAppearsInText(vennText, apiMobileUsers)).toBe(true);
  expect(dashboardPage.countAppearsInText(vennText, apiHqMembers)).toBe(true);
  expect(dashboardPage.countAppearsInText(vennText, apiUsersCanDelete)).toBe(true);
});

test('TC_AP_286 - Verify Mobile App Users Click Action', async ({ dashboardPage, page }) => {
  const apiMobileUsers = await dashboardPage.getApiMobileUsersCount();

  await dashboardPage.openMobileUsersFromVenn();

  await expect(page).toHaveURL(new RegExp(DashboardData.mobileUsersPagePath));
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Mobile Users/i);

  const listingTotal = await dashboardPage.getMobileUsersListingTotal();
  expect(listingTotal).toBe(apiMobileUsers);
  await expect(page.getByText(DashboardData.mobileUsersPaginationPattern(apiMobileUsers))).toBeVisible();
});

test('TC_AP_287 - Verify Group Wise User Graph', async ({ dashboardPage }) => {
  await dashboardPage.scrollToGraph();

  await expect(dashboardPage.groupUserGraph()).toBeVisible();
  await expect(dashboardPage.page.getByText(DashboardData.graphAxisLabels.x)).toBeVisible();
  await expect(dashboardPage.page.getByText(DashboardData.graphAxisLabels.y)).toBeVisible();
});

test('TC_AP_288 - Verify Empty Groups Not Displayed', async ({ dashboardPage }) => {
  const groupLabels = await dashboardPage.getGraphGroupLabels();
  expect(groupLabels.length).toBeGreaterThan(0);

  const emptyGroups = await dashboardPage.getApiEmptyGroupNames();
  for (const emptyGroup of emptyGroups) {
    // Frontend truncates x-axis labels at DASHBORD_ELLIPSIS (12 chars).
    const truncated =
      emptyGroup.length > 12 ? `${emptyGroup.slice(0, 12)}...` : emptyGroup;
    expect(groupLabels).not.toContain(emptyGroup);
    expect(groupLabels).not.toContain(truncated);
  }

  expect(groupLabels).not.toContain(DashboardData.emptyGroupName);
});

test('TC_AP_289 - Verify Tooltip User Categories', async ({ dashboardPage }) => {
  await dashboardPage.hoverOnGroup(0);
  const tooltip = await dashboardPage.getTooltipText();

  for (const field of DashboardData.graphTooltipFields) {
    expect(tooltip).toContain(field);
  }
});

test('TC_AP_290 - Verify Graph User Counts', async ({ dashboardPage }) => {
  const graphBarsCount = await dashboardPage.getGraphBarCount();
  const groupLabels = await dashboardPage.getGraphGroupLabels();

  expect(graphBarsCount).toBeGreaterThan(0);
  expect(groupLabels.length).toBeGreaterThan(0);

  const [apiMobileUsers, apiHqMembers, apiUsersCanDelete, apiRegularUsers] = await Promise.all([
    dashboardPage.getApiMobileUsersCount(),
    dashboardPage.getApiHqMembersCount(),
    dashboardPage.getApiUsersCanDeleteCount(),
    dashboardPage.getApiRegularUsersCount(),
  ]);

  expect(await dashboardPage.getTopBoxCount('Mobile App Users')).toBe(apiMobileUsers);
  expect(await dashboardPage.getTopBoxCount('HQ Members')).toBe(apiHqMembers);
  expect(await dashboardPage.getTopBoxCount('Users Can Delete')).toBe(apiUsersCanDelete);
  expect(apiRegularUsers).toBeGreaterThanOrEqual(0);

  await dashboardPage.hoverOnGroup(0);
  const tooltip = await dashboardPage.getTooltipText();
  const tooltipCounts = dashboardPage.parseTooltipCounts(tooltip);

  for (const field of DashboardData.graphTooltipFields) {
    expect(tooltip).toContain(field);
    expect(tooltipCounts[field]).toBeGreaterThanOrEqual(0);
  }
});

test('TC_AP_291 - Verify Bar Graph Fields', async ({ dashboardPage }) => {
  const groupLabels = await dashboardPage.getGraphGroupLabels();
  expect(groupLabels.length).toBeGreaterThan(0);

  await dashboardPage.hoverOnGroup(0);
  const tooltip = await dashboardPage.getTooltipText();

  for (const field of DashboardData.barGraphFields) {
    expect(tooltip).toContain(field);
  }

  // X-axis may truncate labels with "..."; match the visible prefix in the tooltip.
  const hoveredLabel = groupLabels[0].replace(/\.{2,}$/, '').trim();
  expect(tooltip).toContain(hoveredLabel);
});
