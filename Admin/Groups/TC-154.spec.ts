import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_154 - Verify User Can Be Removed From Group Members List', async ({ groupsPage }) => {
  await groupsPage.openMembersList(GroupsData.groupWithMembers.name);

  const memberCountBefore = await groupsPage.memberRows().count();
  expect(memberCountBefore).toBeGreaterThan(0);

  await groupsPage.selectMemberByIndex(0);
  await groupsPage.removeSelectedMembers();

  const memberCountAfter = await groupsPage.memberRows().count();
  expect(memberCountAfter).toBeLessThan(memberCountBefore);

  await groupsPage.goBackToGroups();
});
