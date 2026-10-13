import { test, expect } from '../fixtures/dashboard.fixture';
import { DashboardData } from '../data/DashboardData';

test('TC_AP_280 - Verify Dashboard Top Boxes', async ({ dashboardPage }) => {
  for (const label of DashboardData.topBoxes) {
    await expect(dashboardPage.topBox(label)).toBeVisible();
    await expect(dashboardPage.topBox(label).locator('p.value')).toBeVisible();
  }
});

test('TC_AP_281 - Verify Dashboard Counts Match Actual Data', async ({ dashboardPage }) => {
  const [apiMobileUsers, apiGroups, apiAdmins] = await Promise.all([
    dashboardPage.getApiMobileUsersCount(),
    dashboardPage.getApiGroupsCount(),
    dashboardPage.getApiAdminsCount(),
  ]);

  expect(await dashboardPage.getTopBoxCount('Mobile App Users')).toBe(apiMobileUsers);
  expect(await dashboardPage.getTopBoxCount('Total Groups')).toBe(apiGroups);
  expect(await dashboardPage.getTopBoxCount('Admins')).toBe(apiAdmins);

  // HQ Members and Users Can Delete — commented out until dedicated filter APIs are mapped.
  // expect(await dashboardPage.getTopBoxCount('HQ Members')).toBe(apiHqMembers);
  // expect(await dashboardPage.getTopBoxCount('Users Can Delete')).toBe(apiUsersCanDelete);
});

test('TC_AP_285 - Verify Venn Diagram Counts', async ({ dashboardPage }) => {
  await expect(dashboardPage.vennDiagram()).toBeVisible();

  const apiMobileUsers = await dashboardPage.getApiMobileUsersCount();
  const vennText = await dashboardPage.vennDiagram().innerText();

  for (const category of DashboardData.vennCategories) {
    expect(vennText).toContain(category);
  }

  expect(vennText).toContain(String(apiMobileUsers));

  // HQ Members and Users Can Delete — commented out until dedicated filter APIs are mapped.
  // const apiHqMembers = await dashboardPage.getApiHqMembersCount();
  // const apiUsersCanDelete = await dashboardPage.getApiUsersCanDeleteCount();
  // expect(vennText).toContain(String(apiHqMembers));
  // expect(vennText).toContain(String(apiUsersCanDelete));
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

  const apiMobileUsers = await dashboardPage.getApiMobileUsersCount();
  const mobileUsers = await dashboardPage.getTopBoxCount('Mobile App Users');
  expect(mobileUsers).toBe(apiMobileUsers);
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
