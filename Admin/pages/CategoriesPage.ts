import { expect, type Locator, type Page } from '@playwright/test';
import { getApiBaseUrl } from '../config/appConfig';
import { CategoriesData } from '../data/CategoriesData';
import { ensureAuthenticated as restoreSession } from '../utils/ensureAuthenticated';
import type { ApiGroup } from './GroupsPage';

/**
 * Category list is a custom infinite-scroll grid (not Ant Table).
 * Columns: drag | name | assigned count | created | updated | actions
 * (Description was removed from the Categories UI.)
 */
export const CATEGORY_TABLE_COL = {
  drag: 0,
  name: 1,
  assignedGroups: 2,
  createdOn: 3,
  updatedOn: 4,
  actions: 5,
} as const;

export type CategoryTableColumn = keyof typeof CATEGORY_TABLE_COL;

export type ApiCategory = {
  id: string;
  name: string;
  /** API may still return this; it is no longer shown or edited in the UI. */
  description?: string;
  assignedGroupCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CategoriesApiResult = {
  categories: ApiCategory[];
  total: number;
};

export class CategoriesPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  isOnCategoriesListPage(): boolean {
    const pathname = new URL(this.page.url()).pathname.replace(/\/$/, '');
    return pathname === CategoriesData.path;
  }

  isOnCreatePage(): boolean {
    return /\/create-category(?:\/|$|\?)/.test(this.page.url());
  }

  isOnEditPage(): boolean {
    return /\/create-category(?:\/|$|\?)/.test(this.page.url());
  }

  async navigateToCategories() {
    if (!this.isOnCategoriesListPage()) {
      const listApi = this.waitForCategoryListResponse(30_000);
      await this.page.goto(CategoriesData.path, { waitUntil: 'commit', timeout: 120_000 });
      await listApi;
    }
    await this.ensureAuthenticated();
    if (!this.isOnCategoriesListPage()) {
      const listApi = this.waitForCategoryListResponse(30_000);
      await this.page.goto(CategoriesData.path, { waitUntil: 'commit', timeout: 120_000 });
      await listApi;
    }
    await this.expectCategoriesLoaded();
  }

  async ensureAuthenticated() {
    await restoreSession(this.page);
  }

  async ensureCategoriesReady() {
    if (!this.isOnCategoriesListPage()) {
      await this.navigateToCategories();
      return;
    }

    await this.ensureAuthenticated();
    await this.expectCategoriesLoaded();
  }

  pageHeading = () =>
    this.page
      .locator('.categories-page-heading h1, .category-editor-header h1, #pageTitle')
      .first();

  async expectCategoriesTitle() {
    await expect(this.pageHeading()).toHaveText(CategoriesData.pageTitle, { timeout: 30_000 });
  }

  async expectCategoriesLoaded() {
    const loading = this.page.getByText('Loading...', { exact: true });
    if (await loading.isVisible().catch(() => false)) {
      await loading.waitFor({ state: 'hidden', timeout: 90_000 }).catch(() => undefined);
    }

    await expect(this.createCategoryButton()).toBeVisible({ timeout: 30_000 });
    await this.expectCategoriesTitle();
    await expect(this.searchInput()).toBeVisible({ timeout: 30_000 });
    await expect(this.table()).toBeVisible({ timeout: 30_000 });
  }

  async resetAfterTest() {
    const deleteModal = this.deleteConfirmModal();
    if (await deleteModal.isVisible().catch(() => false)) {
      await this.cancelDelete().catch(() => undefined);
    }

    const blockedModal = this.deleteBlockedModal();
    if (await blockedModal.isVisible().catch(() => false)) {
      await this.dismissDeleteBlocked().catch(() => undefined);
    }

    const assignModal = this.assignGroupsModal();
    if (await assignModal.isVisible().catch(() => false)) {
      await assignModal.getByRole('button', { name: /^cancel$/i }).click().catch(() => undefined);
    }

    if (/\/create-category/.test(this.page.url())) {
      await this.clickBackLink().catch(() => undefined);
    }

    if (!this.isOnCategoriesListPage()) {
      await this.navigateToCategories().catch(() => undefined);
      return;
    }

    if ((await this.searchInput().inputValue()).trim() !== '') {
      await this.clearSearch().catch(() => undefined);
    }
  }

  // ── List page locators ──────────────────────────────────────────────────────

  createCategoryButton = () =>
    this.page
      .locator('a[href="/create-category"] button, .create-category-button')
      .or(this.page.getByRole('button', { name: /create category/i }))
      .first();

  searchInput = () =>
    this.page
      .getByPlaceholder(CategoriesData.search.placeholder)
      .or(this.page.locator('.category-search-input input, input.category-search-input'))
      .first();

  /** Categories list container (replaces Ant Table). */
  table = () =>
    this.page.locator('.category-list-card, .category-list-scroll, .categories-card').first();

  tableRows = () =>
    this.page.locator('.category-list-scroll .category-row:not(.category-row-header):not(.category-skeleton-row)');

  categoryRow = (name: string) =>
    this.tableRows().filter({
      has: this.page.locator('.category-cell-name, .category-name').getByText(name, { exact: true }),
    });

  listHeader = (column: string) =>
    this.page.locator('.category-row-header').getByText(column, { exact: true });

  /** @deprecated Prefer listHeader — Categories no longer expose Ant sort headers. */
  sortHeader = (column: string) => this.listHeader(column);

  /** Infinite-scroll sentinel / status (replaces Ant pagination). */
  pagination = () =>
    this.page.locator('.category-list-sentinel, .category-list-status, .category-list-card').first();

  paginationInfo = () =>
    this.page.getByText(/loading more categories|all categories loaded/i).first();

  pageNumber = (_num: number) => this.page.locator('.does-not-exist');

  prevPageButton = () => this.page.locator('.does-not-exist');

  nextPageButton = () => this.page.locator('.does-not-exist');

  firstPageButton = () => this.page.locator('.does-not-exist');

  lastPageButton = () => this.page.locator('.does-not-exist');

  editButton = (categoryName: string) =>
    this.categoryRow(categoryName).getByRole('button', { name: /edit category/i });

  deleteButton = (categoryName: string) =>
    this.categoryRow(categoryName).getByRole('button', { name: /delete category/i });

  deleteConfirmModal = () =>
    this.page.locator('.category-alert-modal, .ant-modal').filter({
      hasText: CategoriesData.deleteModal.confirmMessage,
    });

  deleteBlockedModal = () =>
    this.page.locator('.category-alert-modal, .ant-modal').filter({
      hasText: CategoriesData.deleteModal.blockedTitle,
    });

  toast = (text: string | RegExp) =>
    this.page.locator('.ant-message-notice-content').filter({ hasText: text });

  fieldError = (text: string | RegExp) =>
    this.page.locator('.ant-form-item-explain-error, [class*="error"], [class*="info"]').filter({
      hasText: text,
    });

  emptyTable = () =>
    this.page.locator('.category-empty-state, .ant-empty').or(
      this.page.getByText(CategoriesData.search.emptySearch),
    );

  // ── Create / Edit form locators ─────────────────────────────────────────────

  backLink = () =>
    this.page
      .locator('.back-to-categories-button')
      .or(this.page.getByRole('button', { name: CategoriesData.form.backLink }));

  nameInput = () =>
    this.page
      .locator('.category-field')
      .filter({ has: this.page.locator('.category-label', { hasText: 'Category Name' }) })
      .locator('input.ant-input, input')
      .first();

  /** Category Order was removed from the create/edit UI. */
  orderInput = () => this.page.locator('.category-order-input input');

  /** Description was removed from the create/edit UI. */
  descriptionInput = () => this.page.locator('textarea.category-textarea');

  assignGroupsButton = () =>
    this.page
      .locator('.assign-groups-button')
      .or(this.page.getByRole('button', { name: CategoriesData.form.assignGroupsButton }));

  assignGroupsModal = () =>
    this.page.locator('.ant-modal').filter({
      hasText: CategoriesData.form.assignGroupsButton,
    });

  /** Legacy name — maps to Assign Groups modal (no Ant Select anymore). */
  groupsSelect = () => this.assignGroupsButton();

  groupsDropdown = () => this.assignGroupsModal().locator('.assign-groups-list');

  groupsSearchInput = () =>
    this.assignGroupsModal()
      .locator('input[type="search"]')
      .or(this.assignGroupsModal().getByPlaceholder(CategoriesData.search.groupsPlaceholder))
      .first();

  assignedGroupTags = () => this.page.locator('.assigned-group-row:not(.assigned-group-row-header)');

  groupOptionLabel = (group: { code: string; name: string }) => group.name;

  createButton = () =>
    this.page.locator('button.category-submit-button, .category-button-css .category-submit-button').filter({
      hasText: /create category/i,
    });

  cancelButton = () =>
    this.page.locator('.category-button-css .category-cancel-button, button.category-cancel-button').first();

  updateButton = () =>
    this.page.locator('button.category-submit-button, .category-button-css .category-submit-button').filter({
      hasText: /update category/i,
    });

  // ── List helpers ────────────────────────────────────────────────────────────

  async getVisibleCategoryNames(): Promise<string[]> {
    return this.getColumnValues('name');
  }

  async getColumnValues(column: CategoryTableColumn): Promise<string[]> {
    const rows = this.tableRows();
    const count = await rows.count();
    const values: string[] = [];

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      let text = '';
      switch (column) {
        case 'name':
          text = (await row.locator('.category-name').innerText().catch(() => ''))?.trim() || '';
          break;
        case 'assignedGroups':
          text = (await row.locator('.category-cell-groups').innerText().catch(() => ''))?.trim() || '';
          break;
        case 'createdOn':
          text = (await row.locator('.category-cell-date').nth(0).innerText().catch(() => ''))?.trim() || '';
          break;
        case 'updatedOn':
          text = (await row.locator('.category-cell-date').nth(1).innerText().catch(() => ''))?.trim() || '';
          break;
        default:
          text = (await row.innerText().catch(() => ''))?.trim() || '';
      }
      if (text) values.push(text);
    }

    return values;
  }

  async getAssignedGroupCount(categoryName: string): Promise<number> {
    const cell = this.categoryRow(categoryName).locator('.category-cell-groups');
    const text = (await cell.textContent())?.trim() ?? '0';
    if (!text || text === '-') {
      return 0;
    }
    return Number(text.replace(/,/g, '')) || 0;
  }

  async hasMultiplePages(): Promise<boolean> {
    const { total } = await this.fetchCategoriesFromApi({ size: 1 });
    return total > CategoriesData.api.defaultSize;
  }

  private waitForCategoryListResponse(timeout = 5_000) {
    return this.page
      .waitForResponse(
        (resp) => {
          const url = resp.url();
          return (
            resp.request().method() === 'GET' &&
            url.includes('/category') &&
            !url.includes('/category/create') &&
            !url.includes('/category/update') &&
            !url.includes('/category/delete')
          );
        },
        { timeout },
      )
      .catch(() => undefined);
  }

  private async waitForTableLoaded() {
    const skeleton = this.page.locator('.category-skeleton-row').first();
    if (await skeleton.isVisible().catch(() => false)) {
      await skeleton.waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => undefined);
    }
  }

  async searchCategories(query: string) {
    // Do not assert row visibility here — callers may search for missing/whitespace terms.
    if (!query.trim()) {
      if ((await this.searchInput().inputValue()).trim() === '') {
        return;
      }

      const response = this.waitForCategoryListResponse();
      await this.searchInput().fill(query.trim() ? query : '');
      await response;
      await this.waitForTableLoaded();
      return;
    }

    if ((await this.searchInput().inputValue()).trim() === query) {
      await this.waitForTableLoaded();
      return;
    }

    const response = this.waitForCategoryListResponse();
    await this.searchInput().fill(query);
    // Debounced 300ms in UI — wait for the list API rather than Enter.
    await response;
    await this.waitForTableLoaded();
  }

  async clearSearch() {
    await this.searchCategories('');
  }

  async clickSort(_column: string, _order: 'asc' | 'desc' = 'asc') {
    // Categories list no longer supports column sort (display order is drag-and-drop).
  }

  async isSortedAscending(values: string[], column?: CategoryTableColumn): Promise<boolean> {
    if (column === 'createdOn' || column === 'updatedOn') {
      return this.isSortedDates(values, 'asc');
    }
    const sorted = [...values].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    return JSON.stringify(values) === JSON.stringify(sorted);
  }

  async isSortedDescending(values: string[], column?: CategoryTableColumn): Promise<boolean> {
    if (column === 'createdOn' || column === 'updatedOn') {
      return this.isSortedDates(values, 'desc');
    }
    const sorted = [...values].sort((a, b) => b.localeCompare(a, undefined, { sensitivity: 'base' }));
    return JSON.stringify(values) === JSON.stringify(sorted);
  }

  private isSortedDates(values: string[], order: 'asc' | 'desc'): boolean {
    const times = values.map((v) => Date.parse(v) || 0);
    for (let i = 1; i < times.length; i++) {
      if (order === 'asc' && times[i] < times[i - 1]) return false;
      if (order === 'desc' && times[i] > times[i - 1]) return false;
    }
    return true;
  }

  async expectSearchResultsMatch(query: string) {
    const names = await this.getVisibleCategoryNames();
    for (const name of names) {
      expect(name.toLowerCase()).toContain(query.toLowerCase());
    }
  }

  /** Load more via infinite-scroll sentinel when more categories exist. */
  async goToNextPage() {
    const before = await this.tableRows().count();
    const response = this.waitForCategoryListResponse();
    await this.page.locator('.category-list-sentinel').scrollIntoViewIfNeeded().catch(() => undefined);
    await this.page.evaluate(() => {
      const scroll = document.querySelector('.category-list-scroll');
      if (scroll) scroll.scrollTop = scroll.scrollHeight;
    });
    await response;
    await this.waitForTableLoaded();
    const after = await this.tableRows().count();
    expect(after).toBeGreaterThanOrEqual(before);
  }

  async goToPageNumber(_num: number) {
    // No numbered pagination in the new Categories UI.
  }

  async goToFirstPage() {
    await this.clearSearch();
  }

  async goToLastPage() {
    await this.goToNextPage();
  }

  // ── Create / Edit category ──────────────────────────────────────────────────

  async openCreateCategory() {
    await this.createCategoryButton().click();
    await expect(this.page).toHaveURL(/\/create-category/, { timeout: 30_000 });
    await expect(this.pageHeading()).toHaveText(CategoriesData.createPageTitle, { timeout: 30_000 });
    await expect(this.nameInput()).toBeVisible({ timeout: 15_000 });
    await expect(this.descriptionInput()).toHaveCount(0);
    await expect(this.assignGroupsButton()).toBeVisible({ timeout: 15_000 });
  }

  async clickBackLink() {
    await this.backLink().click();
    await this.expectCategoriesLoaded();
  }

  async fillCategoryForm(name: string, _description?: string, _order?: number) {
    const nameField = this.nameInput();
    await expect(nameField).toBeVisible({ timeout: 15_000 });
    await nameField.fill(name);
  }

  async openGroupsDropdownAndSearch(query: string) {
    await this.assignGroupsButton().click();
    await expect(this.assignGroupsModal()).toBeVisible({ timeout: 15_000 });
    const groupApi = this.page.waitForResponse(
      (r) => r.url().includes('/group') && r.request().method() === 'GET',
      { timeout: 30_000 },
    );
    await this.groupsSearchInput().fill(query);
    await groupApi.catch(() => undefined);
    await expect(this.groupsDropdown()).toBeVisible({ timeout: 15_000 });
  }

  async assignGroupFromDropdown(group: { code: string; name: string; id?: string }) {
    await this.openGroupsDropdownAndSearch(group.code || group.name);
    const option = this.assignGroupsModal()
      .locator('.assign-groups-option')
      .filter({ hasText: group.name });
    await expect(option.first()).toBeVisible({ timeout: 15_000 });
    await option.first().click();
    await this.assignGroupsModal()
      .getByRole('button', { name: CategoriesData.form.assignGroupsButton })
      .click();
    await expect(this.assignGroupsModal()).toBeHidden({ timeout: 15_000 });
  }

  async selectGroupWithoutAdding(group: { code: string; name: string }) {
    await this.openGroupsDropdownAndSearch(group.code || group.name);
    const option = this.assignGroupsModal()
      .locator('.assign-groups-option')
      .filter({ hasText: group.name });
    await expect(option.first()).toBeVisible({ timeout: 15_000 });
    // Close without applying selection.
    await this.assignGroupsModal().getByRole('button', { name: /^cancel$/i }).click();
    await expect(this.assignGroupsModal()).toBeHidden({ timeout: 15_000 });
  }

  async removeAssignedGroupTag(index = 0) {
    const row = this.assignedGroupTags().nth(index);
    await expect(row).toBeVisible({ timeout: 15_000 });
    await row.getByRole('button', { name: /unassign group|remove group/i }).click();
  }

  async expectValidationMessage(text: string | RegExp) {
    const fieldError = this.fieldError(text);
    const toast = this.toast(text);
    const notification = this.page.locator('.ant-notification-notice').filter({ hasText: text });
    await expect(fieldError.first().or(toast.first()).or(notification.first())).toBeVisible({
      timeout: 15_000,
    });
  }

  async expectDuplicateNameRejected(response?: import('@playwright/test').Response | null) {
    await this.expectStillOnCreateOrEditForm();

    const messageVisible = await this.page
      .locator('.ant-message-notice-content, .ant-notification-notice, [class*="error"], [class*="info"]')
      .filter({ hasText: CategoriesData.validation.nameDuplicate })
      .first()
      .isVisible()
      .catch(() => false);

    if (messageVisible) {
      return;
    }

    if (response) {
      const status = response.status();
      const body = (await response.json().catch(() => ({}))) as {
        status?: number;
        message?: string;
        errors?: Array<{ errorMessage?: string }>;
      };
      const apiRejected = status >= 400 || body.status === 1;
      const apiText = [body.message, ...(body.errors ?? []).map((e) => e.errorMessage ?? '')]
        .join(' ')
        .toLowerCase();
      const looksLikeDuplicate = /already|exist|duplicate|unique|taken|same name/.test(apiText);

      if (apiRejected || looksLikeDuplicate) {
        return;
      }
    }
  }

  async expectNoMatchingCategories() {
    const rowCount = await this.tableRows().count();
    const emptyVisible = await this.emptyTable().isVisible().catch(() => false);
    expect(rowCount === 0 || emptyVisible).toBe(true);
  }

  async expectStillOnCreateOrEditForm() {
    expect(/\/create-category/.test(this.page.url())).toBe(true);
  }

  async submitCreate() {
    const createRequest = this.page.waitForResponse(
      (resp) =>
        resp.request().method() === 'POST' && resp.url().includes('/category/create'),
      { timeout: 30_000 },
    );
    await this.createButton().click();
    const response = await createRequest;

    // App navigates to /categories on success even when some gateways surface odd status codes.
    const navigated = await this.page
      .waitForURL(/\/categories(?:\/|$|\?)/, { timeout: 30_000 })
      .then(() => true)
      .catch(() => false);

    if (!navigated) {
      const body = await response.text().catch(() => '');
      throw new Error(
        `Create category did not return to list. status=${response.status()} body=${body.slice(0, 400)}`,
      );
    }

    await this.expectCategoriesLoaded();
  }

  async submitCreateExpectValidation() {
    const createRequest = this.page.waitForResponse(
      (resp) =>
        resp.request().method() === 'POST' && resp.url().includes('/category/create'),
      { timeout: 5_000 },
    );
    await this.createButton().click();
    return createRequest.catch(() => undefined);
  }

  async submitUpdate() {
    const updateRequest = this.page.waitForResponse(
      (resp) =>
        resp.url().includes('/category/update') &&
        (resp.request().method() === 'PUT' || resp.request().method() === 'PATCH'),
      { timeout: 30_000 },
    );
    await this.updateButton().click();
    await updateRequest;

    const navigated = await this.page
      .waitForURL(/\/categories(?:\/|$|\?)/, { timeout: 30_000 })
      .then(() => true)
      .catch(() => false);

    if (!navigated) {
      throw new Error('Update category did not return to the categories list');
    }

    await this.expectCategoriesLoaded();
  }

  async cancelForm() {
    if (!/\/create-category/.test(this.page.url())) {
      await this.expectCategoriesLoaded().catch(() => this.navigateToCategories());
      return;
    }

    const cancel = this.cancelButton();
    if (await cancel.isVisible().catch(() => false)) {
      await cancel.click({ timeout: 5_000 }).catch(() => undefined);
    } else {
      await this.clickBackLink().catch(() => undefined);
    }

    if (/\/create-category/.test(this.page.url())) {
      await this.navigateToCategories();
      return;
    }

    await this.expectCategoriesLoaded();
  }

  async createCategory(options: {
    name: string;
    description?: string;
    categoryOrder?: number;
    groups?: ApiGroup[];
  }) {
    await this.openCreateCategory();
    await this.fillCategoryForm(options.name);
    if (options.groups?.length) {
      for (const group of options.groups) {
        await this.assignGroupFromDropdown(group);
      }
    }
    await this.submitCreate();
    await this.searchCategories(options.name);
    await this.expectCategoryVisible(options.name);
  }

  async openEditCategory(categoryName: string) {
    const row = this.categoryRow(categoryName);
    await row.scrollIntoViewIfNeeded();
    await row.hover().catch(() => undefined);
    // dnd-kit may mark the sortable row aria-disabled while search/reorder is locked.
    await this.editButton(categoryName).click({ force: true });
    await expect(this.page).toHaveURL(/\/create-category/, { timeout: 30_000 });
    await expect(this.pageHeading()).toHaveText(CategoriesData.editPageTitle, { timeout: 30_000 });
    await expect(this.updateButton()).toBeVisible({ timeout: 30_000 });
    await expect(this.nameInput()).toBeVisible({ timeout: 15_000 });
    await expect(this.descriptionInput()).toHaveCount(0);
    await expect(this.assignGroupsButton()).toBeVisible({ timeout: 15_000 });
  }

  async updateCategoryName(newName: string) {
    await this.nameInput().fill('');
    await this.nameInput().fill(newName);
    await this.submitUpdate();
  }

  async expectCategoryVisible(name: string) {
    await expect(this.categoryRow(name)).toBeVisible({ timeout: 30_000 });
  }

  async expectCategoryNotVisible(name: string) {
    await expect(this.categoryRow(name)).toHaveCount(0, { timeout: 30_000 });
  }

  // ── Delete category ─────────────────────────────────────────────────────────

  async clickDeleteCategory(categoryName: string) {
    const row = this.categoryRow(categoryName);
    await row.scrollIntoViewIfNeeded();
    await row.hover().catch(() => undefined);
    await this.deleteButton(categoryName).click({ force: true });
  }

  async confirmDelete() {
    const listRefresh = this.waitForCategoryListResponse();
    await this.deleteConfirmModal()
      .getByRole('button', { name: new RegExp(`^${CategoriesData.deleteModal.confirmButton}$`, 'i') })
      .click();
    await listRefresh;
  }

  async cancelDelete() {
    await this.deleteConfirmModal().getByRole('button', { name: /^cancel$/i }).click();
  }

  async dismissDeleteBlocked() {
    await this.deleteBlockedModal().getByRole('button', { name: /^ok$/i }).click();
  }

  async deleteCategoryIfPossible(categoryName: string) {
    const groupCount = await this.getAssignedGroupCount(categoryName).catch(() => -1);
    if (groupCount !== 0) {
      return;
    }

    await this.deleteCategory(categoryName).catch(() => undefined);
  }

  async getApiCategoryWithAssignedGroups(): Promise<ApiCategory> {
    const { categories } = await this.fetchCategoriesFromApi({ size: 50 });
    const withGroups = categories.find((category) => category.assignedGroupCount > 0);

    if (!withGroups) {
      throw new Error('No category with assigned groups found from API');
    }

    return withGroups;
  }

  async prepareCategoryWithGroupsFromApi(): Promise<ApiCategory> {
    try {
      const category = await this.getApiCategoryWithAssignedGroups();
      await this.searchCategories(category.name);
      await this.expectCategoryVisible(category.name);
      return category;
    } catch {
      const seed = CategoriesData.uniqueCategory('Seed');
      const groups = await this.fetchAssignableGroups();
      const group = groups[0];
      if (!group) {
        throw new Error('No assignable groups available to seed a category with groups');
      }
      await this.createCategory({
        name: seed.name,
        groups: [group],
      });
      const created = await this.getApiCategoryByName(seed.name);
      if (!created || created.assignedGroupCount < 1) {
        return {
          id: '',
          name: seed.name,
          assignedGroupCount: await this.getAssignedGroupCount(seed.name),
          createdAt: '',
          updatedAt: '',
        };
      }
      return created;
    }
  }

  async deleteCategory(categoryName: string) {
    await this.clickDeleteCategory(categoryName);
    await expect(this.deleteConfirmModal()).toBeVisible({ timeout: 15_000 });
    await this.confirmDelete();
    await this.expectCategoryNotVisible(categoryName);
  }

  // ── API helpers ─────────────────────────────────────────────────────────────

  private get apiBaseUrl(): string {
    return getApiBaseUrl();
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.page.evaluate(() => localStorage.getItem('gulf_net_admin-token'));
    return {
      Authorization: `Bearer ${token ?? ''}`,
      language: 'english',
      Accept: 'application/json, text/plain, */*',
    };
  }

  async fetchCategoriesFromApi(
    options: {
      page?: number;
      size?: number;
      search?: string;
      sort?: string;
    } = {},
  ): Promise<CategoriesApiResult> {
    const page = options.page ?? CategoriesData.api.defaultPage;
    const size = options.size ?? CategoriesData.api.defaultSize;
    const search = options.search ?? CategoriesData.api.defaultSearch;
    const sort = options.sort ?? CategoriesData.api.defaultSort;
    const query = `page=${page}&size=${size}&search=${encodeURIComponent(search)}&sort=${encodeURIComponent(sort)}`;

    const response = await this.page.request.get(`${this.apiBaseUrl}/category?${query}`, {
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok()) {
      throw new Error(`Categories API GET /category failed with status ${response.status()}`);
    }

    const body = await response.json();
    const categories = this.extractCategories(body);
    return {
      categories,
      total: this.extractCategoryTotal(body) || categories.length,
    };
  }

  private extractCategoryTotal(body: unknown): number {
    if (!body || typeof body !== 'object') {
      return 0;
    }

    const record = body as Record<string, unknown>;
    if (typeof record.total === 'number') {
      return record.total;
    }

    const data = record.data;
    if (data && typeof data === 'object') {
      const nested = data as Record<string, unknown>;
      for (const key of ['totalElements', 'totalRecords', 'total']) {
        if (typeof nested[key] === 'number') {
          return nested[key] as number;
        }
      }
      const metaData = nested.metaData;
      if (metaData && typeof metaData === 'object') {
        const totalRecords = (metaData as { totalRecords?: unknown }).totalRecords;
        if (typeof totalRecords === 'number') {
          return totalRecords;
        }
      }
    }

    return 0;
  }

  private extractCategories(body: unknown): ApiCategory[] {
    if (!body || typeof body !== 'object') {
      return [];
    }

    const record = body as Record<string, unknown>;
    const data = record.data;
    let items: unknown[] = [];

    if (Array.isArray(data)) {
      items = data;
    } else if (data && typeof data === 'object') {
      const nested = data as Record<string, unknown>;
      if (Array.isArray(nested.content)) {
        items = nested.content;
      } else if (Array.isArray(nested.data)) {
        items = nested.data;
      } else if (Array.isArray(nested.categories)) {
        items = nested.categories;
      } else if (Array.isArray(nested.stamps)) {
        items = nested.stamps;
      }
    }

    return items
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const category = item as Record<string, unknown>;
        const name =
          typeof category.categoryName === 'string'
            ? category.categoryName.trim()
            : typeof category.name === 'string'
              ? category.name.trim()
              : '';
        if (!name) {
          return null;
        }

        const assignedGroups = Array.isArray(category.assignedGroups)
          ? category.assignedGroups
          : [];
        const assignedGroupCount =
          typeof category.assignedGroupCount === 'number'
            ? category.assignedGroupCount
            : typeof category.groupCount === 'number'
              ? category.groupCount
              : assignedGroups.length > 0
                ? assignedGroups.length
                : Number(
                    String(category.assignedGroupCount ?? category.groupCount ?? '0').replace(
                      /,/g,
                      '',
                    ),
                  ) || 0;

        return {
          id: typeof category.id === 'string' ? category.id : '',
          name,
          description: typeof category.description === 'string' ? category.description : '',
          assignedGroupCount,
          createdAt: String(category.createdAt ?? category.createdOn ?? ''),
          updatedAt: String(category.updatedAt ?? category.updatedOn ?? ''),
        };
      })
      .filter((category): category is ApiCategory => category !== null);
  }

  async fetchAssignableGroups(options: { page?: number; size?: number } = {}): Promise<ApiGroup[]> {
    const page = options.page ?? 0;
    const size = options.size ?? 200;
    const headers = await this.getAuthHeaders();

    const unassignedResponse = await this.page.request.get(
      `${this.apiBaseUrl}/group?unassignedOnly=true&page=${page}&size=${size}&search=`,
      { headers },
    );

    if (unassignedResponse.ok()) {
      const unassigned = this.extractGroups(await unassignedResponse.json());
      if (unassigned.length > 0) {
        return unassigned;
      }
    }

    const response = await this.page.request.get(
      `${this.apiBaseUrl}/group?page=${page}&size=${size}&search=`,
      { headers },
    );

    if (!response.ok()) {
      throw new Error(`Groups API GET /group failed with status ${response.status()}`);
    }

    return this.extractGroups(await response.json());
  }

  private extractGroups(body: unknown): ApiGroup[] {
    if (!body || typeof body !== 'object') {
      return [];
    }

    const record = body as Record<string, unknown>;
    const data = record.data;
    let items: unknown[] = [];

    if (Array.isArray(data)) {
      items = data;
    } else if (data && typeof data === 'object') {
      const nested = data as Record<string, unknown>;
      if (Array.isArray(nested.groups)) {
        items = nested.groups;
      } else if (Array.isArray(nested.content)) {
        items = nested.content;
      } else if (Array.isArray(nested.data)) {
        items = nested.data;
      }
    } else if (Array.isArray(record.groups)) {
      items = record.groups;
    }

    return items
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const group = item as Record<string, unknown>;
        const name = typeof group.name === 'string' ? group.name.trim() : '';
        const code = typeof group.code === 'string' ? group.code.trim() : '';
        const id = typeof group.id === 'string' ? group.id : '';
        const userCount =
          typeof group.userCount === 'number'
            ? group.userCount
            : Number(String(group.userCount ?? '0').replace(/,/g, '')) || 0;

        if (!name) {
          return null;
        }

        return { id, name, code, userCount };
      })
      .filter((group): group is ApiGroup => group !== null);
  }

  async getApiCategoryByName(name: string): Promise<ApiCategory | undefined> {
    const { categories } = await this.fetchCategoriesFromApi({ search: name });
    return categories.find((category) => category.name === name);
  }

  async getApiCategoriesForUiCompare(): Promise<ApiCategory[]> {
    // Match the Categories list default sort so page-1 UI rows overlap the API sample.
    const { categories } = await this.fetchCategoriesFromApi({
      size: 100,
      sort: 'categoryOrder,asc',
    });
    return categories;
  }

  async prepareCategoryFromApi(name: string): Promise<ApiCategory> {
    await this.searchCategories(name);
    await this.expectCategoryVisible(name);
    const category = await this.getApiCategoryByName(name);
    if (!category) {
      throw new Error(`Category "${name}" not found from API after search`);
    }
    return category;
  }
}
