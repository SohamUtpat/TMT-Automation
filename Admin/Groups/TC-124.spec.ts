import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_124 - Verify Search by Group Name and Code', async ({ groupsPage }) => {
  await groupsPage.expectGroupsLoaded();

  await groupsPage.searchGroups(GroupsData.search.byName);
  await expect(groupsPage.groupRow(GroupsData.hqGroup.name)).toBeVisible();
  await groupsPage.expectSearchResultsMatch(GroupsData.search.byName);

  await groupsPage.clearSearch();
  await groupsPage.searchGroups(GroupsData.search.byCode);
  await expect(groupsPage.groupRow(GroupsData.hqGroup.name)).toBeVisible();
  await groupsPage.expectSearchResultsMatch(GroupsData.search.byCode);
});
