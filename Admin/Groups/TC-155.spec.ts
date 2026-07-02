import { test, expect } from '../fixtures/groups.fixture';

test('TC_AP_155 - Verify Multiple or All Users Can Be Removed From Group', async ({ groupsPage }) => {
  const group = await groupsPage.prepareGroupWithMembersFromApi({
    excludeHq: true,
    minUserCount: 2,
  });
  await groupsPage.openMembersList(group.name);

  const memberCountBefore = await groupsPage.getMembersTotalCount();
  expect(memberCountBefore).toBeGreaterThan(1);

  await groupsPage.selectMemberByIndex(0);
  await groupsPage.selectMemberByIndex(1);
  await groupsPage.removeSelectedMembers();

  await expect
    .poll(async () => groupsPage.getMembersTotalCount(), { timeout: 30_000 })
    .toBeLessThan(memberCountBefore);

  await groupsPage.goBackToGroups();
});
