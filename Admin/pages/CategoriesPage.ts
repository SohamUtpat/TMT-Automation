import { expect, type Locator, type Page } from '@playwright/test';
import { CategoriesData } from '../data/CategoriesData';
import { ensureAuthenticated as restoreSession } from '../utils/ensureAuthenticated';
import type { ApiGroup } from './GroupsPage';

/** Categories table column indices — first column is the category icon. */
export const CATEGORY_TABLE_COL = {
  icon: 0,
  name: 1,
  description: 2,
  createdOn: 3,
  updatedOn: 4,
  assignedGroups: 5,
  actions: 6,
} as const;

export type CategoryTableColumn = keyof typeof CATEGORY_TABLE_COL;

export type ApiCategory = {
  id: string;
  name: string;
  description: string;
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
    return /create-categor/i.test(this.page.url());
  }

  isOnEditPage(): boolean {
    return /edit-categor/i.test(this.page.url());
  }

  async navigateToCategories() {
    if (!this.isOnCategoriesListPage()) {
      const listApi = this.waitForCategoryListResponse();
      await this.page.goto(CategoriesData.path, { waitUntil: 'commit', timeout: 120_000 });
      await listApi;
    }
    await this.ensureAuthenticated();
    if (!this.isOnCategoriesListPage()) {
      const listApi = this.waitForCategoryListResponse();
      await this.page.goto(CategoriesData.path, { waitUntil: 'commit', timeout: 120_000 });
      await listApi;
    }
    await this.expectCategoriesTitle();
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

  async expectCategoriesTitle() {
    await expect(this.page.locator('#pageTitle')).toHaveText(CategoriesData.pageTitle, { timeout: 30_000 });
  }

  async expectCategoriesLoaded() {
    const loading = this.page.getByText('Loading...', { exact: true });
    if (await loading.isVisible().catch(() => false)) {
      await loading.waitFor({ state: 'hidden', timeout: 90_000 }).catch(() => undefined);
    }

    await expect(this.createCategoryButton()).toBeVisible({ timeout: 30_000 });
    await expect(this.page.locator('#pageTitle')).toHaveText(CategoriesData.pageTitle, { timeout: 30_000 });
    await expect(this.searchInput()).toBeVisible({ timeout: 30_000 });
    await expect(this.table()).toBeVisible({ timeout: 30_000 });
  }

  async resetAfterTest() {
    const deleteModal = this.deleteConfirmModal();
    if (await deleteModal.isVisible().catch(() => false)) {
      await this.cancelDelete().catch(() => undefined);
    }

    if (this.isOnCreatePage() || this.isOnEditPage()) {
      await this.clickBackLink().catch(() => undefined);
    }

    if (!this.isOnCategoriesListPage()) {
      await this.navigateToCategories().catch(() => undefined);
      return;
    }

    if ((await this.searchInput().inputValue()).trim() !== '') {
      await this.clearSearch().catch(() => undefined);
    }

    if ((await this.prevPageButton().getAttribute('aria-disabled')) !== 'true') {
      await this.goToFirstPage().catch(() => undefined);
    }
  }

  // ── List page locators ──────────────────────────────────────────────────────

  createCategoryButton = () => this.page.getByRole('button', { name: /create category/i });

  searchInput = () => this.page.getByPlaceholder('Search');

  table = () => this.page.locator('.ant-table');

  tableRows = () => this.page.locator('.ant-table-tbody tr.ant-table-row');

  categoryRow = (name: string) =>
    this.tableRows().filter({
      has: this.page.locator('td').nth(CATEGORY_TABLE_COL.name).getByText(name, { exact: true }),
    });

  sortHeader = (column: string) => this.page.locator('th').filter({ hasText: new RegExp(column, 'i') });

  pagination = () => this.page.locator('.ant-pagination');

  paginationInfo = () => this.page.locator('.ant-pagination-total-text');

  pageNumber = (num: number) => this.pagination().locator(`.ant-pagination-item-${num}`);

  prevPageButton = () => this.pagination().locator('.ant-pagination-prev');

  nextPageButton = () => this.pagination().locator('.ant-pagination-next');

  firstPageButton = () => this.pagination().getByRole('img', { name: 'double-left' });

  lastPageButton = () => this.pagination().getByRole('img', { name: 'double-right' });

  editButton = (categoryName: string) =>
    this.categoryRow(categoryName).locator('button .edit-icon').first();

  deleteButton = (categoryName: string) =>
    this.categoryRow(categoryName).locator('button .delete-icon').first();

  deleteConfirmModal = () =>
    this.page.locator('.common-modal-box, .ant-modal').filter({
      hasText: CategoriesData.deleteModal.confirmTitle,
    });

  toast = (text: string | RegExp) => this.page.locator('.ant-message-notice-content').filter({ hasText: text });

  fieldError = (text: string | RegExp) =>
    this.page.locator('.ant-form-item-explain-error, [class*="error"]').filter({ hasText: text });

  // ── Create / Edit form locators ─────────────────────────────────────────────

  backLink = () => this.page.getByText(CategoriesData.form.backLink, { exact: true });

  nameInput = () => this.page.getByPlaceholder('Type here').first();

  descriptionInput = () => this.page.locator('textarea').first();

  groupsSelect = () =>
    this.page.locator('.ant-select').filter({ has: this.page.getByPlaceholder(/select groups/i) });

  createButton = () => this.page.getByRole('button', { name: /^create$/i });

  cancelButton = () => this.page.getByRole('button', { name: /^cancel$/i });

  updateButton = () => this.page.getByRole('button', { name: /^update$/i });

  // ── Table helpers ───────────────────────────────────────────────────────────

  async getVisibleCategoryNames(): Promise<string[]> {
    return this.getColumnValues('name');
  }

  async getColumnValues(column: CategoryTableColumn): Promise<string[]> {
    const colIndex = CATEGORY_TABLE_COL[column];
    const rows = this.tableRows();
    const count = await rows.count();
    const values: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).locator('td').nth(colIndex).textContent();
      values.push(text?.trim() ?? '');
    }

    return values;
  }

  async getAssignedGroupCount(categoryName: string): Promise<number> {
    const cell = this.categoryRow(categoryName).locator('td').nth(CATEGORY_TABLE_COL.assignedGroups);
    const text = await cell.textContent();
    return Number(text?.trim() ?? '0');
  }

  async hasMultiplePages(): Promise<boolean> {
    const nextDisabled = await this.nextPageButton().getAttribute('aria-disabled');
    const prevDisabled = await this.prevPageButton().getAttribute('aria-disabled');
    return !(nextDisabled === 'true' && prevDisabled === 'true');
  }

  private waitForCategoryListResponse() {
    return this.page
      .waitForResponse(
        (resp) => resp.url().includes('/category') && resp.request().method() === 'GET',
        { timeout: 30_000 },
      )
      .catch(() => undefined);
  }

  private async waitForTableLoaded() {
    await this.page
      .locator('.ant-table-wrapper .ant-spin-spinning')
      .waitFor({ state: 'hidden', timeout: 30_000 })
      .catch(() => undefined);
  }

  async searchCategories(query: string) {
    if (!query) {
      if ((await this.searchInput().inputValue()).trim() === '') {
        return;
      }

      const response = this.waitForCategoryListResponse();
      await this.searchInput().fill('');
      await response;
      return;
    }

    const response = this.waitForCategoryListResponse();
    await this.searchInput().fill(query);
    await this.searchInput().press('Enter');
    await response;
    await this.waitForTableLoaded();
  }

  async clearSearch() {
    await this.searchCategories('');
  }

  async clickSort(column: string, order: 'asc' | 'desc' = 'asc') {
    const iconTitle = order === 'asc' ? 'Sort Ascending' : 'Sort Descending';
    await this.sortHeader(column).getByTitle(iconTitle).click();
    await this.waitForCategoryListResponse();
    await this.waitForTableLoaded();
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

  private isSortedDates(values: string[], direction: 'asc' | 'desc'): boolean {
    const dates = values.filter(Boolean).map((v) => new Date(v).getTime());
    if (dates.length === 0 || dates.some((d) => Number.isNaN(d))) {
      return false;
    }
    const sorted = [...dates].sort((a, b) => (direction === 'asc' ? a - b : b - a));
    return JSON.stringify(dates) === JSON.stringify(sorted);
  }

  async expectSearchResultsMatch(term: string) {
    const names = await this.getColumnValues('name');
    const needle = term.toLowerCase();
    expect(names.every((name) => name.toLowerCase().includes(needle))).toBe(true);
  }

  async goToNextPage() {
    if ((await this.nextPageButton().getAttribute('aria-disabled')) === 'true') {
      return;
    }

    await this.waitForTableLoaded();
    const response = this.waitForCategoryListResponse();
    await this.nextPageButton().locator('button.ant-pagination-item-link').click();
    await response;
    await this.waitForTableLoaded();
  }

  async goToFirstPage() {
    if ((await this.prevPageButton().getAttribute('aria-disabled')) === 'true') {
      return;
    }

    await this.waitForTableLoaded();
    const response = this.waitForCategoryListResponse();
    await this.firstPageButton().click();
    await response;
    await this.waitForTableLoaded();
  }

  async goToLastPage() {
    if ((await this.nextPageButton().getAttribute('aria-disabled')) === 'true') {
      return;
    }

    await this.waitForTableLoaded();
    const response = this.waitForCategoryListResponse();
    await this.lastPageButton().click();
    await response;
    await this.waitForTableLoaded();
  }

  async goToPageNumber(num: number) {
    await this.waitForTableLoaded();
    const response = this.waitForCategoryListResponse();
    await this.pageNumber(num).click();
    await response;
    await this.waitForTableLoaded();
  }

  // ── Create / Edit category ──────────────────────────────────────────────────

  async openCreateCategory() {
    const listApi = this.waitForCategoryListResponse();
    await this.createCategoryButton().click();
    await expect(this.page.locator('#pageTitle')).toHaveText(CategoriesData.createPageTitle, {
      timeout: 30_000,
    });
    await expect(this.nameInput()).toBeVisible({ timeout: 15_000 });
    await listApi.catch(() => undefined);
  }

  async clickBackLink() {
    await this.backLink().click();
    await this.expectCategoriesLoaded();
  }

  async fillCategoryForm(name: string, description = '') {
    await this.nameInput().fill(name);
    if (description) {
      await this.descriptionInput().fill(description);
    }
  }

  async assignGroupFromDropdown(group: { code: string; name: string }) {
    await this.groupsSelect().click();
    const searchInput = this.page.locator('.ant-select-selection-search-input');
    const groupApi = this.page
      .waitForResponse((r) => r.url().includes('/group') && r.request().method() === 'GET', {
        timeout: 30_000,
      })
      .catch(() => undefined);
    await searchInput.fill(group.code);
    await groupApi;
    const dropdown = this.page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)');
    const checkbox = dropdown.getByRole('checkbox', { name: `${group.code}-${group.name}` });
    await expect(checkbox).toBeVisible({ timeout: 15_000 });
    await checkbox.click();
    await dropdown.getByRole('button', { name: /Add/i }).click();
  }

  async submitCreate() {
    const createRequest = this.page.waitForResponse(
      (resp) => resp.url().includes('/category') && resp.request().method() === 'POST',
      { timeout: 30_000 },
    );
    await this.createButton().click();
    await createRequest;
    await this.expectCategoriesLoaded();
  }

  async submitCreateExpectValidation() {
    await this.createButton().click();
  }

  async submitUpdate() {
    const updateRequest = this.page.waitForResponse(
      (resp) =>
        resp.url().includes('/category') &&
        (resp.request().method() === 'PUT' || resp.request().method() === 'PATCH'),
      { timeout: 30_000 },
    );
    await this.updateButton().click();
    await updateRequest;
    await this.expectCategoriesLoaded();
  }

  async cancelForm() {
    await this.cancelButton().click();
    await this.expectCategoriesLoaded();
  }

  async createCategory(options: { name: string; description?: string; groups?: ApiGroup[] }) {
    await this.openCreateCategory();
    await this.fillCategoryForm(options.name, options.description ?? '');
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
    await this.editButton(categoryName).click();
    await expect(this.page.locator('#pageTitle')).toHaveText(
      new RegExp(CategoriesData.editPageTitle, 'i'),
      { timeout: 30_000 },
    );
    await expect(this.nameInput()).toBeVisible({ timeout: 15_000 });
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
    await this.deleteButton(categoryName).click();
  }

  async confirmDelete() {
    await this.deleteConfirmModal().getByRole('button', { name: /^yes$/i }).click();
    await this.waitForCategoryListResponse();
  }

  async cancelDelete() {
    await this.deleteConfirmModal().getByRole('button', { name: /^cancel$/i }).click();
  }

  async deleteCategory(categoryName: string) {
    await this.clickDeleteCategory(categoryName);
    await expect(this.deleteConfirmModal()).toBeVisible({ timeout: 15_000 });
    await this.confirmDelete();
    await this.expectCategoryNotVisible(categoryName);
  }

  // ── API helpers ─────────────────────────────────────────────────────────────

  private get apiBaseUrl(): string {
    const base = (process.env.BASE_URL ?? 'http://18.142.102.68').replace(/\/$/, '');
    return `${base}/api/user-management-service`;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.page.evaluate(() => localStorage.getItem('gulf_net_admin-token'));
    return {
      Authorization: `Bearer ${token ?? ''}`,
      language: 'english',
      Accept: 'application/json, text/plain, */*',
    };
  }

  /** GET /category?page=0&size=25&search=&sort=createdAt,desc — matches categories listing curl. */
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
        const name = typeof category.name === 'string' ? category.name.trim() : '';
        if (!name) {
          return null;
        }

        const assignedGroupCount =
          typeof category.assignedGroupCount === 'number'
            ? category.assignedGroupCount
            : typeof category.groupCount === 'number'
              ? category.groupCount
              : Number(String(category.assignedGroupCount ?? category.groupCount ?? '0').replace(/,/g, '')) || 0;

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
    const response = await this.page.request.get(
      `${this.apiBaseUrl}/group?page=${page}&size=${size}&search=`,
      { headers: await this.getAuthHeaders() },
    );

    if (!response.ok()) {
      throw new Error(`Groups API GET /group failed with status ${response.status()}`);
    }

    const body = await response.json();
    return this.extractGroups(body);
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
      if (Array.isArray(nested.content)) {
        items = nested.content;
      } else if (Array.isArray(nested.data)) {
        items = nested.data;
      }
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
    const { categories } = await this.fetchCategoriesFromApi();
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
