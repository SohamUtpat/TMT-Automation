import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_150 - Verify Edit Organization Group', async ({ groupsPage }) => {
  const group = GroupsData.uniqueGroup('Edit');
  const updatedName = `${group.name}Upd`;

  await groupsPage.createGroup(group.name, group.code);
  await groupsPage.expectGroupVisible(group.name);

  await groupsPage.openEditGroup(group.name);
  await expect(groupsPage.page.getByText(GroupsData.editModal.title)).toBeVisible();
  await expect(groupsPage.modalCodeInput(groupsPage.editModal())).toBeDisabled();

  await groupsPage.updateGroupName(updatedName);
  await groupsPage.expectGroupVisible(updatedName);

  await groupsPage.deleteGroupIfPossible(updatedName);
});
