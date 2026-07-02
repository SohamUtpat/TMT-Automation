import { test } from '../fixtures/groups.fixture';

test('TC_AP_152 - Verify Back Button Redirects to Groups Page', async ({ groupsPage }) => {
  const group = await groupsPage.prepareGroupWithMembersFromApi();
  await groupsPage.openMembersList(group.name, { minimal: true });
  await groupsPage.goBackToGroups();
});
