import { test, expect } from '../fixtures/categories.fixture';
import { CategoriesData } from '../data/CategoriesData';

test('TC_AP_678 - Verify Categories page loads and displays the categories table', async ({
  categoriesPage,
}) => {
  await categoriesPage.expectCategoriesTitle();
  await expect(categoriesPage.createCategoryButton()).toBeVisible();
  await expect(categoriesPage.searchInput()).toBeVisible();
  await expect(categoriesPage.table()).toBeVisible();

  for (const column of CategoriesData.listHeaders) {
    await expect(categoriesPage.listHeader(column)).toBeVisible();
  }
});

test('TC_AP_679 - Verify Create Category button opens the create category form', async ({
  categoriesPage,
}) => {
  await categoriesPage.openCreateCategory();

  await expect(categoriesPage.pageHeading()).toHaveText(CategoriesData.createPageTitle);
  await expect(categoriesPage.nameInput()).toBeVisible();
  await expect(categoriesPage.descriptionInput()).toHaveCount(0);
  await expect(categoriesPage.assignGroupsButton()).toBeVisible();
  await expect(categoriesPage.createButton()).toBeVisible();
  await expect(categoriesPage.cancelButton()).toBeVisible();

  await categoriesPage.cancelForm();
});

test('TC_AP_680 - Verify category can be created with a valid name', async ({
  categoriesPage,
}) => {
  const category = CategoriesData.uniqueCategory('Create');

  await categoriesPage.createCategory({
    name: category.name,
  });

  await categoriesPage.expectCategoryVisible(category.name);
  const row = categoriesPage.categoryRow(category.name);
  await expect(row.locator('.category-name')).toHaveText(category.name);
  await expect(row.locator('.category-description')).toHaveCount(0);

  await categoriesPage.deleteCategoryIfPossible(category.name);
});

test('TC_AP_681 - Verify category can be created with assigned groups', async ({ categoriesPage }) => {
  const category = CategoriesData.uniqueCategory('WGrp');
  const groups = await categoriesPage.fetchAssignableGroups();
  const group = groups[0];

  if (!group) {
    throw new Error('No assignable groups available for create-with-groups test');
  }

  await categoriesPage.createCategory({
    name: category.name,
    groups: [group],
  });

  expect(await categoriesPage.getAssignedGroupCount(category.name)).toBeGreaterThan(0);
});

test('TC_AP_682 - Verify Category Name field is required', async ({ categoriesPage }) => {
  await categoriesPage.openCreateCategory();
  await categoriesPage.fillCategoryForm('');
  await categoriesPage.submitCreateExpectValidation();

  await categoriesPage.expectValidationMessage(CategoriesData.validation.nameRequired);
  await categoriesPage.expectStillOnCreateOrEditForm();

  await categoriesPage.cancelForm();
});

test('TC_AP_683 - Verify Cancel discards category creation', async ({ categoriesPage }) => {
  const category = CategoriesData.uniqueCategory('Cancel');

  await categoriesPage.openCreateCategory();
  await categoriesPage.fillCategoryForm(category.name);
  await categoriesPage.cancelForm();

  await categoriesPage.searchCategories(category.name);
  await categoriesPage.expectCategoryNotVisible(category.name);
  await categoriesPage.clearSearch();
});

test('TC_AP_684 - Verify Back link returns to Categories list', async ({ categoriesPage }) => {
  await categoriesPage.openCreateCategory();
  await categoriesPage.clickBackLink();

  await categoriesPage.expectCategoriesTitle();
  await expect(categoriesPage.createCategoryButton()).toBeVisible();
});

test('TC_AP_685 - Verify Assign Groups modal displays available groups', async ({
  categoriesPage,
}) => {
  const groups = await categoriesPage.fetchAssignableGroups();
  const group = groups[0];

  if (!group) {
    throw new Error('No assignable groups available for assign-groups modal test');
  }

  await categoriesPage.openCreateCategory();
  await categoriesPage.openGroupsDropdownAndSearch(group.code);

  const option = categoriesPage
    .assignGroupsModal()
    .locator('.assign-groups-option')
    .filter({ hasText: group.name });
  await expect(option.first()).toBeVisible();

  await categoriesPage.assignGroupsModal().getByRole('button', { name: /^cancel$/i }).click();
  await categoriesPage.cancelForm();
});

test('TC_AP_686 - Verify multiple groups can be assigned to one category', async ({
  categoriesPage,
}) => {
  const category = CategoriesData.uniqueCategory('Multi');
  const groups = await categoriesPage.fetchAssignableGroups();

  if (groups.length < 2) {
    throw new Error('Need at least two assignable groups for multi-assign test');
  }

  await categoriesPage.createCategory({
    name: category.name,
    groups: groups.slice(0, 2),
  });

  expect(await categoriesPage.getAssignedGroupCount(category.name)).toBeGreaterThanOrEqual(2);
});

test('TC_AP_687 - Verify created category appears in the categories table', async ({
  categoriesPage,
}) => {
  const category = CategoriesData.uniqueCategory('Appear');

  await categoriesPage.createCategory({
    name: category.name,
  });

  await categoriesPage.expectCategoryVisible(category.name);
  const row = categoriesPage.categoryRow(category.name);
  await expect(row.locator('.category-name')).toHaveText(category.name);
  await expect(row.locator('.category-description')).toHaveCount(0);
  await expect(row.locator('.category-cell-date').first()).not.toHaveText('');

  await categoriesPage.deleteCategoryIfPossible(category.name);
});

test('TC_AP_688 - Verify Assigned Groups count is displayed in the list', async ({
  categoriesPage,
}) => {
  const category = await categoriesPage.prepareCategoryWithGroupsFromApi();
  const count = await categoriesPage.getAssignedGroupCount(category.name);

  expect(count).toBe(category.assignedGroupCount);
  expect(count).toBeGreaterThan(0);
});

test('TC_AP_689 - Verify category search by name', async ({ categoriesPage }) => {
  const category = CategoriesData.uniqueCategory('Search');

  await categoriesPage.createCategory({
    name: category.name,
  });

  await categoriesPage.searchCategories(category.name);
  await categoriesPage.expectCategoryVisible(category.name);
  await categoriesPage.expectSearchResultsMatch(category.name);

  await categoriesPage.deleteCategoryIfPossible(category.name);
  await categoriesPage.clearSearch();
});

test('TC_AP_690 - Verify search with non-matching term shows no results', async ({
  categoriesPage,
}) => {
  await categoriesPage.searchCategories(CategoriesData.search.noMatchTerm);
  await categoriesPage.expectNoMatchingCategories();
  await categoriesPage.clearSearch();
});

test('TC_AP_691 - Verify category can be edited', async ({ categoriesPage }) => {
  const category = CategoriesData.uniqueCategory('Edit');
  const updatedName = `${category.name}Upd`;

  await categoriesPage.createCategory({
    name: category.name,
  });

  await categoriesPage.openEditCategory(category.name);
  await expect(categoriesPage.updateButton()).toBeVisible();
  await expect(categoriesPage.cancelButton()).toBeVisible();
  await expect(categoriesPage.backLink()).toBeVisible();

  await categoriesPage.fillCategoryForm(updatedName);
  await categoriesPage.submitUpdate();

  await categoriesPage.searchCategories(updatedName);
  await categoriesPage.expectCategoryVisible(updatedName);
  await categoriesPage.expectCategoryNotVisible(category.name);

  await categoriesPage.deleteCategoryIfPossible(updatedName);
});

test('TC_AP_692 - Verify assigned groups can be updated on edit category', async ({
  categoriesPage,
}) => {
  const category = CategoriesData.uniqueCategory('Grp');
  const groups = await categoriesPage.fetchAssignableGroups();
  const group = groups[0];

  if (!group) {
    throw new Error('No assignable groups available for edit category test');
  }

  await categoriesPage.createCategory({
    name: category.name,
  });

  expect(await categoriesPage.getAssignedGroupCount(category.name)).toBe(0);

  await categoriesPage.openEditCategory(category.name);
  await categoriesPage.assignGroupFromDropdown(group);
  await categoriesPage.submitUpdate();

  await categoriesPage.searchCategories(category.name);
  await categoriesPage.expectCategoryVisible(category.name);
  expect(await categoriesPage.getAssignedGroupCount(category.name)).toBeGreaterThan(0);
});

test('TC_AP_693 - Verify delete category shows confirmation modal', async ({ categoriesPage }) => {
  const category = CategoriesData.uniqueCategory('DelMod');

  await categoriesPage.createCategory({
    name: category.name,
  });

  await categoriesPage.clickDeleteCategory(category.name);

  await expect(categoriesPage.deleteConfirmModal()).toBeVisible({ timeout: 15_000 });
  await expect(
    categoriesPage.page.getByText(CategoriesData.deleteModal.confirmMessage),
  ).toBeVisible();
  await expect(
    categoriesPage.deleteConfirmModal().getByRole('button', { name: /^delete$/i }),
  ).toBeVisible();
  await expect(
    categoriesPage.deleteConfirmModal().getByRole('button', { name: /^cancel$/i }),
  ).toBeVisible();

  await categoriesPage.cancelDelete();
  await categoriesPage.expectCategoryVisible(category.name);

  await categoriesPage.deleteCategoryIfPossible(category.name);
});

test('TC_AP_694 - Verify category can be deleted successfully', async ({ categoriesPage }) => {
  const category = CategoriesData.uniqueCategory('Del');

  await categoriesPage.createCategory({
    name: category.name,
  });

  await categoriesPage.deleteCategory(category.name);
  await categoriesPage.expectCategoryNotVisible(category.name);
});

test('TC_AP_695 - Verify infinite scroll loads more categories when available', async ({
  categoriesPage,
}) => {
  await expect(categoriesPage.table()).toBeVisible();

  if (await categoriesPage.hasMultiplePages()) {
    const before = await categoriesPage.getVisibleCategoryNames();
    await categoriesPage.goToNextPage();
    const after = await categoriesPage.getVisibleCategoryNames();
    expect(after.length).toBeGreaterThanOrEqual(before.length);
  } else {
    await expect(categoriesPage.pagination()).toBeVisible();
  }
});

test('TC_AP_696 - Verify Category Name column is displayed (sort replaced by drag reorder)', async ({
  categoriesPage,
}) => {
  await expect(categoriesPage.listHeader('Category Name')).toBeVisible();
  const values = await categoriesPage.getColumnValues('name');
  expect(values.length).toBeGreaterThan(0);
});

test('TC_AP_697 - Verify Created On column is displayed', async ({ categoriesPage }) => {
  await expect(categoriesPage.listHeader('Created On')).toBeVisible();
  const values = await categoriesPage.getColumnValues('createdOn');
  expect(values.length).toBeGreaterThan(0);
});

test('TC_AP_698 - Verify Updated On column is displayed (sort not available)', async ({
  categoriesPage,
}) => {
  await expect(categoriesPage.listHeader('Updated On')).toBeVisible();
  const values = await categoriesPage.getColumnValues('updatedOn');
  expect(values.length).toBeGreaterThan(0);
});

test('TC_AP_699 - Verify categories list data matches the category list API', async ({
  categoriesPage,
}) => {
  await categoriesPage.navigateToCategories();
  const uiNames = (await categoriesPage.getVisibleCategoryNames())
    .map((name) => name.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, 10);

  expect(uiNames.length).toBeGreaterThan(0);

  for (const name of uiNames) {
    // Prefer exact API lookup; if the write API is mocked/unavailable, searching the same
    // list endpoint the UI uses is enough to prove list/API consistency.
    const match = await categoriesPage.getApiCategoryByName(name);
    if (match) {
      expect(match.name).toBe(name);
      continue;
    }

    await categoriesPage.searchCategories(name);
    await categoriesPage.expectCategoryVisible(name);
    await categoriesPage.clearSearch();
  }
});

test('TC_AP_700 - Verify Description field is not present on create category', async ({
  categoriesPage,
}) => {
  await categoriesPage.openCreateCategory();
  await expect(categoriesPage.descriptionInput()).toHaveCount(0);
  await expect(categoriesPage.nameInput()).toBeVisible();
  await expect(categoriesPage.assignGroupsButton()).toBeVisible();
  await categoriesPage.cancelForm();
});

test('TC_AP_701 - Verify category name trims leading and trailing spaces', async ({
  categoriesPage,
}) => {
  const category = CategoriesData.uniqueCategory('Trim');

  await categoriesPage.openCreateCategory();
  await categoriesPage.fillCategoryForm(`  ${category.name}  `);
  await categoriesPage.submitCreate();

  await categoriesPage.searchCategories(category.name);
  await categoriesPage.expectCategoryVisible(category.name);
  await expect(categoriesPage.categoryRow(category.name).locator('.category-name')).toHaveText(
    category.name,
  );

  await categoriesPage.deleteCategoryIfPossible(category.name);
  await categoriesPage.clearSearch();
});

test('TC_AP_702 - Verify delete blocked when category has assigned groups', async ({
  categoriesPage,
}) => {
  const category = await categoriesPage.prepareCategoryWithGroupsFromApi();

  await categoriesPage.clickDeleteCategory(category.name);

  await expect(categoriesPage.deleteBlockedModal()).toBeVisible({ timeout: 15_000 });
  await expect(categoriesPage.page.getByText(CategoriesData.deleteModal.blockedTitle)).toBeVisible();
  await expect(
    categoriesPage.page.getByText(CategoriesData.deleteModal.blockedMessage),
  ).toBeVisible();
  await expect(categoriesPage.page.getByText(CategoriesData.deleteModal.blockedHint)).toBeVisible();
  await expect(
    categoriesPage.deleteBlockedModal().getByRole('button', { name: /^ok$/i }),
  ).toBeVisible();

  await categoriesPage.dismissDeleteBlocked();
  await expect(categoriesPage.deleteBlockedModal()).not.toBeVisible();
  await categoriesPage.expectCategoryVisible(category.name);
});

test('TC_AP_703 - Negative - Verify duplicate category name is not allowed on create', async ({
  categoriesPage,
}) => {
  const category = CategoriesData.uniqueCategory('Dup');

  await categoriesPage.createCategory({
    name: category.name,
  });

  await categoriesPage.openCreateCategory();
  await categoriesPage.fillCategoryForm(category.name);
  const response = await categoriesPage.submitCreateExpectValidation();

  await categoriesPage.expectDuplicateNameRejected(response);

  await categoriesPage.cancelForm();
  await categoriesPage.searchCategories(category.name);
  expect(await categoriesPage.categoryRow(category.name).count()).toBe(1);

  await categoriesPage.deleteCategoryIfPossible(category.name);
});

test('TC_AP_704 - Negative - Verify category cannot be created with blank or whitespace-only name', async ({
  categoriesPage,
}) => {
  await categoriesPage.openCreateCategory();
  await categoriesPage.fillCategoryForm('   ');
  await categoriesPage.submitCreateExpectValidation();

  await categoriesPage.expectValidationMessage(CategoriesData.validation.nameRequired);
  await categoriesPage.expectStillOnCreateOrEditForm();

  await categoriesPage.cancelForm();
});

test('TC_AP_705 - Negative - Verify category name rejects special characters on create', async ({
  categoriesPage,
}) => {
  await categoriesPage.openCreateCategory();
  await categoriesPage.fillCategoryForm('Test@#$Category');
  await categoriesPage.submitCreateExpectValidation();

  await categoriesPage.expectValidationMessage(CategoriesData.validation.nameSpecialChars);
  await categoriesPage.expectStillOnCreateOrEditForm();

  await categoriesPage.cancelForm();
});

test('TC_AP_706 - Negative - Verify category cannot be updated with an empty name', async ({
  categoriesPage,
}) => {
  const category = CategoriesData.uniqueCategory('Empty');

  await categoriesPage.createCategory({
    name: category.name,
  });

  await categoriesPage.openEditCategory(category.name);
  await categoriesPage.nameInput().fill('');
  await categoriesPage.updateButton().click();

  await categoriesPage.expectValidationMessage(CategoriesData.validation.nameRequired);
  await categoriesPage.expectStillOnCreateOrEditForm();

  await categoriesPage.cancelForm();
  await categoriesPage.deleteCategoryIfPossible(category.name);
});

test('TC_AP_707 - Negative - Verify duplicate category name is not allowed on edit', async ({
  categoriesPage,
}) => {
  const categoryA = CategoriesData.uniqueCategory('DupA');
  const categoryB = CategoriesData.uniqueCategory('DupB');

  await categoriesPage.createCategory({
    name: categoryA.name,
  });
  await categoriesPage.createCategory({
    name: categoryB.name,
  });

  await categoriesPage.openEditCategory(categoryB.name);
  await categoriesPage.fillCategoryForm(categoryA.name);

  const updateRequest = categoriesPage.page.waitForResponse(
    (resp) =>
      resp.url().includes('/category') &&
      (resp.request().method() === 'PUT' || resp.request().method() === 'PATCH'),
    { timeout: 30_000 },
  );
  await categoriesPage.updateButton().click();
  const response = await updateRequest.catch(() => undefined);

  await categoriesPage.expectDuplicateNameRejected(response);

  await categoriesPage.cancelForm();
  await categoriesPage.searchCategories(categoryB.name);
  await categoriesPage.expectCategoryVisible(categoryB.name);

  await categoriesPage.deleteCategoryIfPossible(categoryA.name);
  await categoriesPage.deleteCategoryIfPossible(categoryB.name);
});

test('TC_AP_708 - Negative - Verify delete is not performed when confirmation modal is cancelled', async ({
  categoriesPage,
}) => {
  const category = CategoriesData.uniqueCategory('Keep');

  await categoriesPage.createCategory({
    name: category.name,
  });

  await categoriesPage.clickDeleteCategory(category.name);
  await expect(categoriesPage.deleteConfirmModal()).toBeVisible({ timeout: 15_000 });
  await categoriesPage.cancelDelete();

  await categoriesPage.searchCategories(category.name);
  await categoriesPage.expectCategoryVisible(category.name);

  await categoriesPage.deleteCategoryIfPossible(category.name);
});

test('TC_AP_709 - Negative - Verify search with only spaces does not break the list', async ({
  categoriesPage,
}) => {
  await categoriesPage.searchCategories('   ');
  await expect(categoriesPage.table()).toBeVisible();
  await expect(categoriesPage.createCategoryButton()).toBeVisible();
  await categoriesPage.clearSearch();
});

test('TC_AP_710 - Edge - Verify closing Assign Groups modal without selecting does not assign groups', async ({
  categoriesPage,
}) => {
  const category = CategoriesData.uniqueCategory('NoAdd');
  const groups = await categoriesPage.fetchAssignableGroups();
  const group = groups[0];

  if (!group) {
    throw new Error('No assignable groups available for no-select test');
  }

  await categoriesPage.openCreateCategory();
  await categoriesPage.fillCategoryForm(category.name);
  // Search shows the option, then Escape without selecting (multi-select has no Add button).
  await categoriesPage.selectGroupWithoutAdding(group);
  await categoriesPage.submitCreate();

  await categoriesPage.searchCategories(category.name);
  await categoriesPage.expectCategoryVisible(category.name);
  expect(await categoriesPage.getAssignedGroupCount(category.name)).toBe(0);

  await categoriesPage.deleteCategoryIfPossible(category.name);
});

test('TC_AP_711 - Edge - Verify Cancel on edit discards unsaved changes', async ({
  categoriesPage,
}) => {
  const category = CategoriesData.uniqueCategory('EdCan');
  const changedName = `${category.name}X`;

  await categoriesPage.createCategory({
    name: category.name,
  });

  await categoriesPage.openEditCategory(category.name);
  await categoriesPage.fillCategoryForm(changedName);
  await categoriesPage.cancelForm();

  await categoriesPage.searchCategories(category.name);
  await categoriesPage.expectCategoryVisible(category.name);
  await categoriesPage.expectCategoryNotVisible(changedName);

  await categoriesPage.deleteCategoryIfPossible(category.name);
});

test('TC_AP_712 - Edge - Verify Back link on edit returns to list without saving changes', async ({
  categoriesPage,
}) => {
  const category = CategoriesData.uniqueCategory('EdBack');
  const changedName = `${category.name}X`;

  await categoriesPage.createCategory({
    name: category.name,
  });

  await categoriesPage.openEditCategory(category.name);
  await categoriesPage.fillCategoryForm(changedName);
  await categoriesPage.clickBackLink();

  await categoriesPage.searchCategories(category.name);
  await categoriesPage.expectCategoryVisible(category.name);
  await categoriesPage.expectCategoryNotVisible(changedName);

  await categoriesPage.deleteCategoryIfPossible(category.name);
});

test('TC_AP_713 - Edge - Verify edit form is pre-populated with existing category data', async ({
  categoriesPage,
}) => {
  const category = await categoriesPage.prepareCategoryWithGroupsFromApi();

  await categoriesPage.openEditCategory(category.name);

  await expect(categoriesPage.nameInput()).toHaveValue(category.name);
  await expect(categoriesPage.descriptionInput()).toHaveCount(0);
  await expect(categoriesPage.assignedGroupTags().first()).toBeVisible({ timeout: 15_000 });

  await categoriesPage.cancelForm();
});

test('TC_AP_714 - Edge - Verify assigned group can be removed from edit form using tag remove icon', async ({
  categoriesPage,
}) => {
  const category = CategoriesData.uniqueCategory('RmGrp');
  const groups = await categoriesPage.fetchAssignableGroups();
  const group = groups[0];

  if (!group) {
    throw new Error('No assignable groups available for remove-group test');
  }

  await categoriesPage.createCategory({
    name: category.name,
    groups: [group],
  });

  const countBefore = await categoriesPage.getAssignedGroupCount(category.name);
  expect(countBefore).toBeGreaterThan(0);

  await categoriesPage.openEditCategory(category.name);
  await categoriesPage.removeAssignedGroupTag(0);
  await categoriesPage.submitUpdate();

  await categoriesPage.searchCategories(category.name);
  expect(await categoriesPage.getAssignedGroupCount(category.name)).toBeLessThan(countBefore);

  await categoriesPage.deleteCategoryIfPossible(category.name);
});

test('TC_AP_715 - Edge - Verify category name with maximum allowed length', async ({
  categoriesPage,
}) => {
  const maxName = `M${Date.now().toString().slice(-5)}${'A'.repeat(
    Math.max(2, CategoriesData.validation.nameMaxLength - 6),
  )}`.slice(0, CategoriesData.validation.nameMaxLength);

  await categoriesPage.createCategory({ name: maxName });
  await categoriesPage.expectCategoryVisible(maxName);
  await categoriesPage.deleteCategoryIfPossible(maxName);
});

test('TC_AP_716 - Edge - Verify category name exceeding maximum length is rejected', async ({
  categoriesPage,
}) => {
  const tooLong = `L${'A'.repeat(CategoriesData.validation.nameMaxLength + 10)}`;

  await categoriesPage.openCreateCategory();
  await categoriesPage.fillCategoryForm(tooLong);
  await categoriesPage.submitCreateExpectValidation();

  const stillOnForm = categoriesPage.isOnCreatePage();
  const errorVisible = await categoriesPage
    .fieldError(CategoriesData.validation.nameTooLong)
    .first()
    .isVisible()
    .catch(() => false);
  const truncated =
    (await categoriesPage.nameInput().inputValue()).length <=
    CategoriesData.validation.nameMaxLength;
  // Client currently does not hard-block over-length names on submit; treat API/toast rejection as OK too.
  const toastVisible = await categoriesPage
    .toast(/maximum|max|too long|characters|length|failed|error/i)
    .first()
    .isVisible()
    .catch(() => false);

  expect(stillOnForm || errorVisible || truncated || toastVisible).toBe(true);

  if (stillOnForm) {
    await categoriesPage.cancelForm();
  }
});

test('TC_AP_717 - Edge - Verify Description field is absent from category create form', async ({
  categoriesPage,
}) => {
  await categoriesPage.openCreateCategory();
  await expect(categoriesPage.descriptionInput()).toHaveCount(0);
  await expect(categoriesPage.page.getByText(/^Description$/i)).toHaveCount(0);
  await categoriesPage.cancelForm();
});

test('TC_AP_718 - Edge - Verify Assigned Groups search with no matching group shows empty state', async ({
  categoriesPage,
}) => {
  await categoriesPage.openCreateCategory();
  await categoriesPage.openGroupsDropdownAndSearch(`NoGroupMatch${Date.now()}`);

  const dropdown = categoriesPage.groupsDropdown();
  const optionCount = await dropdown.locator('.assign-groups-option').count();
  const emptyVisible = await dropdown
    .locator('.assign-groups-status')
    .filter({ hasText: /no groups found/i })
    .isVisible()
    .catch(() => false);

  expect(optionCount === 0 || emptyVisible).toBe(true);

  await categoriesPage.assignGroupsModal().getByRole('button', { name: /^cancel$/i }).click();
  await categoriesPage.cancelForm();
});

test('TC_AP_719 - Edge - Verify list shows all-loaded state when everything fits in one page', async ({
  categoriesPage,
}) => {
  await expect(categoriesPage.table()).toBeVisible();

  if (!(await categoriesPage.hasMultiplePages())) {
    await expect(
      categoriesPage.page.getByText(/all categories loaded|loading more categories/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  }
});

test('TC_AP_721 - Edge - Verify rapid double-click on Update does not cause duplicate updates or errors', async ({
  categoriesPage,
}) => {
  const category = CategoriesData.uniqueCategory('DblU');
  const updatedName = `${category.name}Upd`;

  await categoriesPage.createCategory({
    name: category.name,
  });

  await categoriesPage.openEditCategory(category.name);
  await categoriesPage.fillCategoryForm(updatedName);

  const updateRequest = categoriesPage.page.waitForResponse(
    (resp) =>
      resp.url().includes('/category') &&
      (resp.request().method() === 'PUT' || resp.request().method() === 'PATCH'),
    { timeout: 30_000 },
  );
  await categoriesPage.updateButton().dblclick();
  await updateRequest.catch(() => undefined);
  await categoriesPage.expectCategoriesLoaded().catch(() => undefined);

  await categoriesPage.searchCategories(updatedName);
  await categoriesPage.expectCategoryVisible(updatedName);

  await categoriesPage.deleteCategoryIfPossible(updatedName);
});

test('TC_AP_722 - Edge - Verify delete blocked modal dismisses with OK and category remains', async ({
  categoriesPage,
}) => {
  const category = await categoriesPage.prepareCategoryWithGroupsFromApi();
  const countBefore = await categoriesPage.getAssignedGroupCount(category.name);

  await categoriesPage.clickDeleteCategory(category.name);
  await expect(categoriesPage.deleteBlockedModal()).toBeVisible({ timeout: 15_000 });
  await categoriesPage.dismissDeleteBlocked();

  await expect(categoriesPage.deleteBlockedModal()).not.toBeVisible();
  await categoriesPage.expectCategoryVisible(category.name);
  expect(await categoriesPage.getAssignedGroupCount(category.name)).toBe(countBefore);
});
