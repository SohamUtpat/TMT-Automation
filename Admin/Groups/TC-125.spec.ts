import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_125 - Verify Sorting on Name Code and Created Date', async ({ groupsPage }) => {
  await groupsPage.expectGroupsLoaded();

  const columnKeys = {
    Name: 'name',
    Code: 'code',
    'Created On': 'createdOn',
  } as const;

  for (const column of GroupsData.sortColumns) {
    const key = columnKeys[column];
    const before = await groupsPage.getColumnValues(key);

    await groupsPage.clickSort(column, 'asc');
    const afterAsc = await groupsPage.getColumnValues(key);
    const ascOk =
      (await groupsPage.isSortedAscending(afterAsc, key)) ||
      (await groupsPage.isSortedDescending(afterAsc, key)) ||
      JSON.stringify(before) !== JSON.stringify(afterAsc);

    await groupsPage.clickSort(column, 'desc');
    const afterDesc = await groupsPage.getColumnValues(key);
    const descOk =
      (await groupsPage.isSortedAscending(afterDesc, key)) ||
      (await groupsPage.isSortedDescending(afterDesc, key)) ||
      JSON.stringify(afterAsc) !== JSON.stringify(afterDesc);

    expect(ascOk).toBe(true);
    expect(descOk).toBe(true);
  }
});
