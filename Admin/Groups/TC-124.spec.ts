import { test, expect } from '../fixtures/groups.fixture';

test('TC_AP_124 - Verify Search by Group Name and Code', async ({ groupsPage }) => {
  const hqGroup = await groupsPage.prepareHqGroupFromApi();

  await groupsPage.searchGroups(hqGroup.name);
  await expect(groupsPage.groupRow(hqGroup.name)).toBeVisible();
  await groupsPage.expectSearchResultsMatch(hqGroup.name);

  await groupsPage.clearSearch();
  await groupsPage.searchGroups(hqGroup.code);
  await expect(groupsPage.groupRow(hqGroup.name)).toBeVisible();
  await groupsPage.expectSearchResultsMatch(hqGroup.code);
});
