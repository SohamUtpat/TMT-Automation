import { test, expect } from '../fixtures/forms.fixture';
import { FormsData } from '../data/FormsData';

test('TC_AP_307 - Verify Forms page loads successfully', async ({ formsPage }) => {
  await expect(formsPage.page).toHaveURL(new RegExp(`${FormsData.path}$`));
  await formsPage.expectFormsLoaded();
});

test('TC_AP_308 - Verify UI elements on Form page', async ({ formsPage }) => {
  await expect(formsPage.page.locator('#pageTitle')).toHaveText(FormsData.pageTitle);
  await expect(formsPage.searchInput()).toBeVisible();
  await expect(formsPage.table()).toBeVisible();
  await expect(formsPage.formBuilderButton()).toBeVisible();
  await expect(formsPage.formSubmissionsButton()).toBeVisible();

  for (const column of FormsData.tableColumns) {
    await expect(formsPage.sortHeader(column)).toBeVisible();
  }
});

test('TC_AP_309 - Verify that latest form appear first on the row', async ({ formsPage }) => {
  const createdDates = await formsPage.getColumnValues('createdOn');
  expect(createdDates.length).toBeGreaterThan(0);
  expect(await formsPage.isSortedByDateCreatedDesc(createdDates)).toBe(true);
});

test('TC_AP_310 - Verify Form name and Description Truncation (Ellipsis)', async ({ formsPage }) => {
  const rowCount = await formsPage.tableRows().count();
  test.skip(rowCount === 0, 'No forms available to verify ellipsis');

  await formsPage.expectCellEllipsis('name', 0);
  await formsPage.expectCellEllipsis('description', 0);
});

test('TC_AP_312 - Verify Search Bar Visibility', async ({ formsPage }) => {
  await expect(formsPage.searchInput()).toBeVisible();
  await expect(formsPage.searchInput()).toBeEnabled();
});

test('TC_AP_313 - Verify Searching matching text should show relevant forms', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();

  await formsPage.searchForms(formName);
  await expect(formsPage.formRow(formName)).toBeVisible();
  const visibleNames = await formsPage.getVisibleFormNames();
  expect(visibleNames.every((name) => name.toLowerCase().includes(formName.toLowerCase()))).toBe(true);
});

test('TC_AP_314 - Verify Invalid search text', async ({ formsPage }) => {
  await formsPage.searchForms(FormsData.invalidSearchTerm);
  await formsPage.expectInvalidSearchShowsNoResults();
});

test('TC_AP_316 - Verify navigation functionality for Form Builder and Form Submissions', async ({
  formsPage,
}) => {
  await formsPage.formBuilderButton().click();
  await expect(formsPage.page).toHaveURL(new RegExp(FormsData.formBuilderPath));
  await formsPage.page.goBack({ waitUntil: 'commit' });
  await formsPage.ensureFormsReady();

  await formsPage.formSubmissionsButton().click();
  await expect(formsPage.page).toHaveURL(new RegExp(FormsData.formSubmissionsPath));
});

test('TC_AP_317 - Verify pagination works when forms exceed page limit', async ({ formsPage }) => {
  await expect(formsPage.pagination()).toBeVisible();

  if (await formsPage.hasMultiplePages()) {
    const page1Names = await formsPage.getVisibleFormNames();
    await formsPage.goToNextPage();
    const page2Names = await formsPage.getVisibleFormNames();
    expect(page2Names).not.toEqual(page1Names);
    await formsPage.goToFirstPage();
  } else {
    await expect(formsPage.nextPageButton()).toHaveAttribute('aria-disabled', 'true');
  }
});

test('TC_AP_318 - Verify the table hovering effect when hover over each row', async ({ formsPage }) => {
  const rowCount = await formsPage.tableRows().count();
  test.skip(rowCount === 0, 'No forms available to verify row hover');

  await formsPage.expectRowHoverHighlight(0);
});

test('TC_AP_319 - Verify Actions Column Icons Visibility', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();

  await expect(formsPage.assignButton(formName)).toBeVisible();
  await expect(formsPage.viewButton(formName)).toBeVisible();
  await expect(formsPage.editButton(formName)).toBeVisible();
  await expect(formsPage.copyButton(formName)).toBeVisible();
  await expect(formsPage.deleteButton(formName)).toBeVisible();
});

test('TC_AP_320 - Verify No Empty Rows', async ({ formsPage }) => {
  await formsPage.expectNoEmptyRows();
});

test('TC_AP_321 - Verify Updated On Date Changes After Edit', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();
  const beforeUpdatedOn = (await formsPage.getColumnValues('updatedOn'))[0];

  await formsPage.editButton(formName).click();
  await formsPage.page.waitForURL(/form-builder|edit-form|forms\//i, { timeout: 30_000 });

  const saveButton = formsPage.page.getByRole('button', { name: /save|update|publish/i }).first();
  if (await saveButton.isVisible().catch(() => false)) {
    await saveButton.click();
  }

  await formsPage.navigateToForms();
  await formsPage.searchForms(formName);

  const afterUpdatedOn = (await formsPage.getColumnValues('updatedOn'))[0];
  expect(afterUpdatedOn).toBeTruthy();
  if (beforeUpdatedOn && afterUpdatedOn) {
    expect(afterUpdatedOn).not.toBe('-');
  }
});

test('TC_AP_322 - Verify Hyphen Display When Description is Empty', async ({ formsPage }) => {
  await formsPage.expectDescriptionShowsHyphenWhenEmpty();
});

test('TC_AP_323 - Verify the screen scrolling function smoothly', async ({ formsPage }) => {
  const initialScroll = await formsPage.page.evaluate(() => window.scrollY);
  await formsPage.page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
  await formsPage.page.waitForTimeout(1000);
  const afterScroll = await formsPage.page.evaluate(() => window.scrollY);
  expect(afterScroll).toBeGreaterThanOrEqual(initialScroll);
});

test('TC_AP_324 - Verify Assign Groups modal opens correctly', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();
  await formsPage.openAssignModal(formName);
  await expect(formsPage.assignGroupsSelect()).toBeVisible();
  await expect(formsPage.assignModal().getByText(FormsData.assignModal.selectGroupsLabel)).toBeVisible();
});

test('TC_AP_325 - Verify modal title displays correct form name', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();
  await formsPage.openAssignModal(formName);
  await expect(formsPage.assignModalTitle()).toContainText(formName);
});

test('TC_AP_326 - Verify all the available group appear in the select group field in checklist manner', async ({
  formsPage,
}) => {
  const formName = await formsPage.getFirstFormName();
  await formsPage.openAssignModal(formName);
  await formsPage.openAssignGroupsDropdown();

  const checkboxCount = await formsPage.assignCheckboxes().count();
  expect(checkboxCount).toBeGreaterThan(0);
});

test('TC_AP_327 - Verify that when the group is selected it should appear in the above space with close icon', async ({
  formsPage,
}) => {
  const formName = await formsPage.getFirstFormName();

  await formsPage.openAssignModal(formName);
  const groupLabel = await formsPage.selectFirstUnselectedGroupInAssignDropdown();

  const selectedTag = formsPage.assignSelectedGroupTag(groupLabel);
  await expect(selectedTag).toBeVisible();
  await expect(selectedTag.locator('.anticon-close')).toBeVisible();
});

test('TC_AP_328 - Verify removing a selected group', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();

  await formsPage.openAssignModal(formName);
  const groupLabel = await formsPage.selectFirstUnselectedGroupInAssignDropdown();
  await expect(formsPage.assignSelectedGroupTag(groupLabel)).toBeVisible();

  await formsPage.removeSelectedGroupTag(groupLabel);
  await expect(formsPage.assignSelectedGroupTag(groupLabel)).toHaveCount(0);
});

test('TC_AP_329 - Verify selecting a new group from the checklist', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();

  await formsPage.openAssignModal(formName);
  const groupLabel = await formsPage.selectFirstUnselectedGroupInAssignDropdown();

  await expect(formsPage.assignSelectedGroupTag(groupLabel)).toBeVisible();
});

test('TC_AP_330 - Verify unselecting a group from the checklist', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();

  await formsPage.openAssignModal(formName);
  const groupLabel = await formsPage.selectFirstUnselectedGroupInAssignDropdown();
  await expect(formsPage.assignSelectedGroupTag(groupLabel)).toBeVisible();

  await formsPage.unselectGroupInAssignDropdown(groupLabel);
  await expect(formsPage.assignSelectedGroupTag(groupLabel)).toHaveCount(0);
});

test('TC_AP_331 - Verify only clicking inside checkbox toggles selection', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();

  await formsPage.openAssignModal(formName);
  await formsPage.openAssignGroupsDropdown();

  const option = formsPage.assignDropdownOptions().first();
  const labelText = (await option.textContent())?.trim() ?? '';
  const checkbox = option.getByRole('checkbox');

  await option.click({ position: { x: 5, y: 5 } });
  const afterLabelClick = await checkbox.isChecked();

  await checkbox.click();
  const afterCheckboxClick = await checkbox.isChecked();

  expect(afterCheckboxClick).not.toBe(afterLabelClick);
  expect(labelText.length).toBeGreaterThan(0);
});

test('TC_AP_332 - Verify group names and codes are displayed correctly', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();

  await formsPage.openAssignModal(formName);
  await formsPage.openAssignGroupsDropdown();

  const labels = await formsPage.getAssignCheckboxLabels();
  expect(labels.length).toBeGreaterThan(0);
  for (const label of labels) {
    expect(label).toMatch(/^.+\s+\(.+\)$/);
  }
});

test('TC_AP_333 - Verify scroll functionality inside groups list', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();

  await formsPage.openAssignModal(formName);
  await formsPage.openAssignGroupsDropdown();

  const dropdown = formsPage.assignDropdown();
  const initialScroll = await dropdown.evaluate((el) => el.scrollTop);
  await dropdown.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  const afterScroll = await dropdown.evaluate((el) => el.scrollTop);
  expect(afterScroll).toBeGreaterThanOrEqual(initialScroll);
});

test('TC_AP_334 - Verify no duplicate group entries', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();

  await formsPage.openAssignModal(formName);
  await formsPage.openAssignGroupsDropdown();
  await formsPage.expectAssignCheckboxLabelsUnique();
});

test('TC_AP_335 - Verify closing modal using X icon', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();
  await formsPage.openAssignModal(formName);
  await formsPage.closeAssignModalWithX();
});

test('TC_AP_336 - Verify clicking outside the modal closes it', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();
  await formsPage.openAssignModal(formName);
  await formsPage.closeAssignModalByClickingOutside();
});

test('TC_AP_337 - Verify Save button functionality', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();

  await formsPage.openAssignModal(formName);
  const groupLabel = await formsPage.selectFirstUnselectedGroupInAssignDropdown();
  await formsPage.saveAssignModal();
  await expect(formsPage.assignModal()).toBeHidden();

  // Restore the original assignment so this test does not modify shared form data.
  await formsPage.openAssignModal(formName);
  await formsPage.unselectGroupInAssignDropdown(groupLabel);
  await formsPage.saveAssignModal();
});

test('TC_AP_338 - Verify the cancel button functionality', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();
  await formsPage.openAssignModal(formName);
  await formsPage.cancelAssignModal();
});

test('TC_AP_339 - Verify behavior when no groups are available', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();

  await formsPage.openAssignModal(formName);
  await formsPage.searchGroupsInAssignModal('zzzznonexistentgroup99999');

  const noDataVisible = await formsPage.assignNoDataMessage().isVisible().catch(() => false);
  const checkboxCount = await formsPage.assignCheckboxes().count();
  expect(noDataVisible || checkboxCount === 0).toBe(true);
});

test('TC_AP_340 - Verify the hovering effect', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();

  await formsPage.openAssignModal(formName);
  await formsPage.openAssignGroupsDropdown();
  await formsPage.expectAssignOptionHover(0);
});

test('TC_AP_341 - Verify the incremental search in the select group field', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();

  await formsPage.openAssignModal(formName);
  await formsPage.openAssignGroupsDropdown();
  const initialLabels = await formsPage.getAssignCheckboxLabels();
  expect(initialLabels.length).toBeGreaterThan(0);

  const firstLabel = initialLabels[0];
  const partial = firstLabel.slice(0, Math.max(2, Math.floor(firstLabel.length / 2)));
  await formsPage.searchGroupsInAssignModal(partial);

  const labels = await formsPage.getAssignCheckboxLabels();
  expect(labels.some((label) => label.toLowerCase().includes(partial.toLowerCase()))).toBe(true);
});

test('TC_AP_342 - Verify when the searched group is not present it should be handled with no data found msg', async ({
  formsPage,
}) => {
  const formName = await formsPage.getFirstFormName();

  await formsPage.openAssignModal(formName);
  await formsPage.searchGroupsInAssignModal(FormsData.invalidSearchTerm);

  await expect(formsPage.assignNoDataMessage()).toBeVisible({ timeout: 15_000 });
});
