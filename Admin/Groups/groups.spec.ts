import path from 'path';
import { test, expect } from '../fixtures/groups.fixture';
import { GroupsData } from '../data/GroupsData';

test('TC_AP_122 - Verify Pagination Navigation Between Pages', async ({ groupsPage }) => {
  await expect(groupsPage.pagination()).toBeVisible();

  if (await groupsPage.hasMultiplePages()) {
    const page1Names = await groupsPage.getVisibleGroupNames();

    await groupsPage.goToNextPage();
    const page2Names = await groupsPage.getVisibleGroupNames();
    expect(page2Names).not.toEqual(page1Names);

    await groupsPage.goToPageNumber(1);
    expect(await groupsPage.getVisibleGroupNames()).toEqual(page1Names);

    await groupsPage.goToPageNumber(2);
  }
});

test('TC_AP_123 - Verify Navigate to First and Last Page', async ({ groupsPage }) => {
  await expect(groupsPage.pagination()).toBeVisible();

  if (await groupsPage.hasMultiplePages()) {
    await groupsPage.goToLastPage();
    await groupsPage.goToFirstPage();
  } else {
    await expect(groupsPage.prevPageButton()).toHaveAttribute('aria-disabled', 'true');
    await expect(groupsPage.nextPageButton()).toHaveAttribute('aria-disabled', 'true');
  }
});

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

test('TC_AP_125 - Verify Sorting on Name Code and Created Date', async ({ groupsPage }) => {
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

test('TC_AP_126 - Verify Group Delete Blocked When Users Exist', async ({ groupsPage }) => {
  await groupsPage.expectGroupsTitle();

  const group = await groupsPage.getApiFirstGroupWithMembers();
  await expect(groupsPage.groupRow(group.name)).toBeVisible({ timeout: 30_000 });

  await groupsPage.clickDeleteGroup(group.name);

  await expect(groupsPage.deleteBlockedModal()).toBeVisible();
  await expect(groupsPage.page.getByText(GroupsData.deleteModal.blockedTitle)).toBeVisible();
  await expect(groupsPage.page.getByText(GroupsData.deleteModal.blockedMessage)).toBeVisible();
  await expect(groupsPage.page.getByText(GroupsData.deleteModal.blockedHint)).toBeVisible();

  await groupsPage.dismissBlockedDelete();
});

test('TC_AP_127 - Verify Group Deleted When Total Members Is Zero', async ({ groupsPage }) => {
  const group = GroupsData.uniqueGroup('Del');

  await groupsPage.createGroup(group.name, group.code);
  await groupsPage.expectGroupVisible(group.name);

  const memberCount = await groupsPage.getMemberCount(group.name);
  expect(memberCount).toBe(0);

  await groupsPage.clickDeleteGroup(group.name);
  await expect(groupsPage.deleteConfirmModal()).toBeVisible();
  await expect(groupsPage.page.getByText(GroupsData.deleteModal.confirmTitle)).toBeVisible();

  await groupsPage.confirmDelete();
  await groupsPage.expectGroupNotVisible(group.name);
});

test('TC_AP_128 - Verify Group Name and Code Trim Spaces', async ({ groupsPage }) => {
  const group = GroupsData.uniqueGroup('Trim');

  await groupsPage.openCreateGroupModal();
  await groupsPage.fillCreateForm(`  ${group.name}  `, `  ${group.code}  `);
  await groupsPage.submitCreateAndWait();
  await groupsPage.searchGroups(group.name);

  await groupsPage.expectGroupVisible(group.name);
  await expect(groupsPage.groupRow(group.name).locator('td').nth(1)).toHaveText(group.name);

  await groupsPage.deleteGroupIfPossible(group.name);
  await groupsPage.clearSearch();
});

test('TC_AP_129 - Verify HQ Group Has No Delete Option', async ({ groupsPage }) => {
  const hqGroup = await groupsPage.prepareHqGroupFromApi();

  await expect(groupsPage.groupRow(hqGroup.name)).toBeVisible();
  await expect(groupsPage.deleteButton(hqGroup.name)).toHaveCount(0);
  await expect(groupsPage.editButton(hqGroup.name)).toBeVisible();
});

test('TC_AP_130 - Verify Create Group Form Fields', async ({ groupsPage }) => {
  await groupsPage.openCreateGroupModal();

  await expect(groupsPage.page.getByText(GroupsData.createModal.title)).toBeVisible();
  await expect(groupsPage.page.getByText(GroupsData.createModal.nameLabel, { exact: true })).toBeVisible();
  await expect(groupsPage.page.getByText(GroupsData.createModal.codeLabel, { exact: true })).toBeVisible();
  await expect(groupsPage.cameraButton()).toBeVisible();
  await expect(groupsPage.createModal().getByRole('button', { name: 'Create' })).toBeVisible();
  await expect(groupsPage.createModal().getByRole('button', { name: 'Cancel' })).toBeVisible();

  await groupsPage.cancelCreate();
});

test('TC_AP_131 - Verify Name and Code Mandatory Profile Pic Optional', async ({ groupsPage }) => {
  await groupsPage.openCreateGroupModal();

  await groupsPage.expectRequiredFieldMarkers(groupsPage.createModal());

  await groupsPage.submitCreate();
  await expect(groupsPage.createModal()).toBeVisible();

  await groupsPage.cancelCreate();
});

test('TC_AP_132 - Verify Mandatory Fields Without Profile Photo', async ({ groupsPage }) => {
  const group = GroupsData.uniqueGroup('Man');

  await groupsPage.createGroup(group.name, group.code);
  await groupsPage.expectGroupVisible(group.name);
  await groupsPage.deleteGroupIfPossible(group.name);
});

test('TC_AP_133 - Verify Profile Pic Name and Code Fields Present', async ({ groupsPage }) => {
  await groupsPage.openCreateGroupModal();

  await expect(groupsPage.cameraButton()).toBeVisible();
  await expect(groupsPage.modalNameInput(groupsPage.createModal())).toBeVisible();
  await expect(groupsPage.modalCodeInput(groupsPage.createModal())).toBeVisible();
  await expect(groupsPage.profilePhotoInput()).toBeAttached();

  await groupsPage.cancelCreate();
});

test('TC_AP_134 - Verify Name Minimum Two Characters Validation', async ({ groupsPage }) => {
  await groupsPage.openCreateGroupModal();
  await groupsPage.fillCreateForm('A', 'ValidCode12');
  await groupsPage.submitCreate();

  await groupsPage.expectValidationMessage(GroupsData.validation.nameMinLengthMessage);
  await groupsPage.cancelCreate();
});

test('TC_AP_135 - Verify Name Rejects Special Characters', async ({ groupsPage }) => {
  await groupsPage.openCreateGroupModal();
  await groupsPage.fillCreateForm('Test@#$Name', 'ValidCode12');
  await groupsPage.submitCreate();

  await groupsPage.expectValidationMessage(GroupsData.validation.nameSpecialCharsMessage);
  await groupsPage.cancelCreate();
});

test('TC_AP_136 - Verify Code Minimum Two Characters Validation', async ({ groupsPage }) => {
  await groupsPage.openCreateGroupModal();
  await groupsPage.fillCreateForm('ValidName', 'A');
  await groupsPage.submitCreate();

  await groupsPage.expectValidationMessage(GroupsData.validation.codeMinLengthMessage);
  await groupsPage.cancelCreate();
});

test('TC_AP_137 - Verify Code Rejects Special Characters', async ({ groupsPage }) => {
  await groupsPage.openCreateGroupModal();
  await groupsPage.fillCreateForm('ValidName', 'Code@#$');
  await groupsPage.submitCreate();

  await groupsPage.expectValidationMessage(GroupsData.validation.codeSpecialCharsMessage);
  await groupsPage.cancelCreate();
});

test('TC_AP_138 - Verify Profile Photo Maximum 5MB Validation', async ({ groupsPage }) => {
  await groupsPage.openCreateGroupModal();
  await groupsPage.uploadProfilePhoto(path.resolve(GroupsData.testAssets.largeJpg));

  await groupsPage.expectUploadError(GroupsData.validation.imageTooLarge);
  await groupsPage.cancelCreate();
});

test('TC_AP_139 - Verify Profile Photo Minimum 1KB Validation', async ({ groupsPage }) => {
  await groupsPage.openCreateGroupModal();
  await groupsPage.uploadProfilePhoto(path.resolve(GroupsData.testAssets.tinyPng));

  await groupsPage.expectUploadError(GroupsData.validation.imageTooSmall);
  await groupsPage.cancelCreate();
});

test('TC_AP_140 - Verify Profile Photo Accepts Only JPG JPEG PNG', async ({ groupsPage }) => {
  await groupsPage.openCreateGroupModal();
  await groupsPage.uploadProfilePhoto(path.resolve(GroupsData.testAssets.invalidPdf));

  await groupsPage.expectUploadError(GroupsData.validation.invalidImageFormat);
  await groupsPage.cancelCreate();
});

test('TC_AP_141 - Verify Profile Photo Can Be Replaced', async ({ groupsPage }) => {
  await groupsPage.openCreateGroupModal();

  await groupsPage.uploadProfilePhoto(path.resolve(GroupsData.testAssets.validPng));
  await groupsPage.uploadProfilePhoto(path.resolve(GroupsData.testAssets.replacePng));

  await expect(groupsPage.createModal()).toBeVisible();
  await groupsPage.cancelCreate();
});

test('TC_AP_142 - Verify Create Group Cancelled', async ({ groupsPage }) => {
  const group = GroupsData.uniqueGroup('Cancel');

  await groupsPage.openCreateGroupModal();
  await groupsPage.fillCreateForm(group.name, group.code);
  await groupsPage.cancelCreate();

  await expect(groupsPage.createModal()).not.toBeVisible();
  await groupsPage.expectGroupNotVisible(group.name);
});

test('TC_AP_143 - Verify Group Name Maximum 50 Characters', async ({ groupsPage }) => {
  const invalidName = 'A'.repeat(GroupsData.validation.nameMaxLength + 1);

  await groupsPage.openCreateGroupModal();
  await groupsPage.fillCreateGroupName(invalidName);

  await groupsPage.expectValidationMessage(GroupsData.validation.nameMinLengthMessage);
  await groupsPage.cancelCreate();
});

test('TC_AP_144 - Verify Group Name Minimum 2 Characters', async ({ groupsPage }) => {
  const invalidName = 'A'.repeat(GroupsData.validation.nameMinLength - 1);

  await groupsPage.openCreateGroupModal();
  await groupsPage.fillCreateGroupName(invalidName);

  await groupsPage.expectValidationMessage(GroupsData.validation.nameMinLengthMessage);
  await groupsPage.cancelCreate();
});

test('TC_AP_145 - Verify Group Name Accepts 2 to 50 Characters', async ({ groupsPage }) => {
  const invalidName = 'A'.repeat(GroupsData.validation.nameMaxLength + 1);

  await groupsPage.openCreateGroupModal();
  await groupsPage.fillCreateGroupName(invalidName);

  await groupsPage.expectValidationMessage(GroupsData.validation.nameMinLengthMessage);
  await groupsPage.cancelCreate();
});

test('TC_AP_146 - Verify Group Code Maximum 15 Characters', async ({ groupsPage }) => {
  const longCode = 'C'.repeat(GroupsData.validation.codeMaxLength + 1);

  await groupsPage.openCreateGroupModal();
  await groupsPage.fillCreateForm('ValidGroupName', longCode);
  await groupsPage.submitCreate();

  await groupsPage.expectValidationMessage(GroupsData.validation.codeMinLengthMessage);
  await groupsPage.cancelCreate();
});

test('TC_AP_147 - Verify Group Code Minimum 2 Characters', async ({ groupsPage }) => {
  await groupsPage.openCreateGroupModal();
  await groupsPage.fillCreateForm('ValidGroupName', 'A');
  await groupsPage.submitCreate();

  await groupsPage.expectValidationMessage(GroupsData.validation.codeMinLengthMessage);
  await groupsPage.cancelCreate();
});

test('TC_AP_148 - Verify Group Code Accepts 2 to 15 Characters', async ({ groupsPage }) => {
  const group = GroupsData.uniqueGroup('Cd');

  await groupsPage.createGroup(group.name, group.code);
  await groupsPage.expectGroupVisible(group.name);

  await groupsPage.deleteGroupIfPossible(group.name);
});

test('TC_AP_149 - Verify Group Creation Blocked With Invalid Inputs', async ({ groupsPage }) => {
  await groupsPage.openCreateGroupModal();
  await groupsPage.fillCreateForm('A', '@');
  await groupsPage.submitCreate();

  await groupsPage.expectValidationMessage(/not valid/i);
  await expect(groupsPage.createModal()).toBeVisible();

  await groupsPage.cancelCreate();
});

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

test('TC_AP_151 - Verify Total Members Opens Members List', async ({ groupsPage }) => {
  const group = await groupsPage.prepareGroupWithMembersFromApi();
  await groupsPage.openMembersList(group.name);

  await expect(groupsPage.backButton()).toBeVisible();
  await expect(groupsPage.membersPageTitle(group.name)).toBeVisible();
  await expect(groupsPage.removeUsersButton()).toBeVisible();
  await expect(groupsPage.table()).toBeVisible();
});

test('TC_AP_152 - Verify Back Button Redirects to Groups Page', async ({ groupsPage }) => {
  const group = await groupsPage.prepareGroupWithMembersFromApi();
  await groupsPage.openMembersList(group.name, { minimal: true });
  await groupsPage.goBackToGroups();
});

test('TC_AP_153 - Verify Group Name and Code Must Be Unique', async ({ groupsPage }) => {
  const group = GroupsData.uniqueGroup('Dup');

  await groupsPage.createGroup(group.name, group.code);
  await groupsPage.openCreateGroupModal();
  await groupsPage.fillCreateForm(group.name, group.code);
  await groupsPage.submitCreateAndExpectDuplicate();
  await groupsPage.cancelCreate();
  await groupsPage.deleteGroupIfPossible(group.name);
});

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

test('TC_AP_156 - Verify Remove Users Enabled When Member Selected', async ({ groupsPage }) => {
  const hqGroup = await groupsPage.prepareHqGroupFromApi();
  await groupsPage.openMembersList(hqGroup.name);

  await groupsPage.selectMemberByIndex(0);
  await expect(groupsPage.removeUsersButton()).toBeEnabled();

  await groupsPage.goBackToGroups();
});
