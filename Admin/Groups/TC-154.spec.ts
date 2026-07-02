import { test, expect } from '../fixtures/groups.fixture';

test('TC_AP_154 - Verify User Can Be Removed From Group Members List', async ({ groupsPage }) => {
  const group = await groupsPage.prepareGroupWithMembersFromApi({ excludeHq: true });
  await groupsPage.openMembersList(group.name);

  const totalBefore = await groupsPage.getMembersTotalCount();
  expect(totalBefore).toBeGreaterThan(0);

  await groupsPage.selectMemberByIndex(0);
  await groupsPage.removeSelectedMembers();

  await expect
    .poll(async () => groupsPage.getMembersTotalCount())
    .toBeLessThan(totalBefore);

  await groupsPage.goBackToGroups();
});
