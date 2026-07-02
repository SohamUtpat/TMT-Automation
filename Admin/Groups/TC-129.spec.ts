import { test, expect } from '../fixtures/groups.fixture';

test('TC_AP_129 - Verify HQ Group Has No Delete Option', async ({ groupsPage }) => {
  const hqGroup = await groupsPage.prepareHqGroupFromApi();

  await expect(groupsPage.groupRow(hqGroup.name)).toBeVisible();
  await expect(groupsPage.deleteButton(hqGroup.name)).toHaveCount(0);
  await expect(groupsPage.editButton(hqGroup.name)).toBeVisible();
});
