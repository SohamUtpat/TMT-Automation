import { expect, type Locator, type Page } from '@playwright/test';
import { FormsData } from '../data/FormsData';
import { ensureAuthenticated as restoreSession } from '../utils/ensureAuthenticated';
import type { ApiGroup } from './GroupsPage';

/** Forms table column indices on the manage screen. */
export const FORM_TABLE_COL = {
  name: 0,
  description: 1,
  createdOn: 2,
  updatedOn: 3,
  actions: 4,
} as const;

export type FormTableColumn = keyof typeof FORM_TABLE_COL;

export type ApiForm = {
  id: string;
  name: string;
  description: string;
  dateCreated: string;
  dateUpdated: string;
  assignedGroupCount?: number;
};

export type FormsApiResult = {
  forms: ApiForm[];
  total: number;
};

export class FormsPage {
  readonly page: Page;
  private savedAssignGroups: string[] | null = null;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  isOnFormsListPage(): boolean {
    const pathname = new URL(this.page.url()).pathname.replace(/\/$/, '');
    return pathname === FormsData.path;
  }

  async navigateToForms() {
    if (!this.isOnFormsListPage()) {
      const listApi = this.waitForFormListResponse();
      await this.page.goto(FormsData.path, { waitUntil: 'commit', timeout: 120_000 });
      await listApi;
    }
    await this.ensureAuthenticated();
    if (!this.isOnFormsListPage()) {
      const listApi = this.waitForFormListResponse();
      await this.page.goto(FormsData.path, { waitUntil: 'commit', timeout: 120_000 });
      await listApi;
    }
    await this.expectFormsTitle();
  }

  async ensureAuthenticated() {
    await restoreSession(this.page);
  }

  async ensureFormsReady() {
    if (!this.isOnFormsListPage()) {
      await this.navigateToForms();
      return;
    }

    await this.ensureAuthenticated();
    await this.expectFormsLoaded();
  }

  async expectFormsTitle() {
    await expect(this.page.locator('#pageTitle')).toHaveText(FormsData.pageTitle, { timeout: 30_000 });
  }

  async expectFormsLoaded() {
    const loading = this.page.getByText('Loading...', { exact: true });
    if (await loading.isVisible().catch(() => false)) {
      await loading.waitFor({ state: 'hidden', timeout: 90_000 }).catch(() => undefined);
    }

    await expect(this.page.locator('#pageTitle')).toHaveText(FormsData.pageTitle, { timeout: 30_000 });
    await expect(this.searchInput()).toBeVisible({ timeout: 30_000 });
    await expect(this.table()).toBeVisible({ timeout: 30_000 });
  }

  async resetAfterTest() {
    if (await this.assignModal().isVisible().catch(() => false)) {
      await this.cancelAssignModal().catch(() => undefined);
    }

    if (!this.isOnFormsListPage()) {
      await this.navigateToForms().catch(() => undefined);
      return;
    }

    if ((await this.searchInput().inputValue()).trim() !== '') {
      await this.clearSearch().catch(() => undefined);
    }

    if ((await this.prevPageButton().getAttribute('aria-disabled')) !== 'true') {
      await this.goToFirstPage().catch(() => undefined);
    }
  }

  // ── Top navigation buttons ───────────────────────────────────────────────────

  formBuilderButton = () => this.page.getByRole('button', { name: /form builder/i });

  formSubmissionsButton = () => this.page.getByRole('button', { name: /form submissions/i });

  // ── List page locators ──────────────────────────────────────────────────────

  searchInput = () => this.page.getByPlaceholder('Search by name');

  searchSubmitButton = () => this.searchInput().locator('xpath=ancestor::*[contains(@class,"input") or contains(@class,"search")][1]').getByRole('button').first();

  table = () => this.page.locator('.ant-table');

  tableBody = () => this.page.locator('.ant-table-tbody');

  tableRows = () => this.page.locator('.ant-table-tbody tr.ant-table-row');

  formRow = (name: string) =>
    this.tableRows().filter({
      has: this.page.locator('td').nth(FORM_TABLE_COL.name).getByText(name, { exact: true }),
    });

  sortHeader = (column: string) => this.page.locator('th').filter({ hasText: new RegExp(column, 'i') });

  pagination = () => this.page.locator('.ant-pagination');

  paginationInfo = () => this.page.locator('.ant-pagination-total-text');

  pageNumber = (num: number) => this.pagination().locator(`.ant-pagination-item-${num}`);

  prevPageButton = () => this.pagination().locator('.ant-pagination-prev');

  nextPageButton = () => this.pagination().locator('.ant-pagination-next');

  firstPageButton = () => this.pagination().getByRole('img', { name: 'double-left' });

  lastPageButton = () => this.pagination().getByRole('img', { name: 'double-right' });

  assignButton = (formName: string) =>
    this.formRow(formName).getByRole('button', { name: 'plus-circle' });

  viewButton = (formName: string) => this.formRow(formName).getByRole('button', { name: 'eye' });

  editButton = (formName: string) => this.formRow(formName).getByRole('button', { name: 'edit' });

  copyButton = (formName: string) => this.formRow(formName).getByRole('button', { name: 'copy' });

  deleteButton = (formName: string) => this.formRow(formName).getByRole('button', { name: 'delete' });

  assignModal = () => this.page.getByRole('dialog').filter({ hasText: FormsData.assignModal.titlePattern });

  assignModalTitle = () => this.assignModal().getByText(FormsData.assignModal.titlePattern);

  assignModalCloseIcon = () => this.assignModal().getByRole('button', { name: 'Close' });

  assignGroupsSelect = () => this.assignModal().getByRole('combobox');

  assignSelectedGroupTags = () => this.assignModal().locator('.ant-select-selection-item, button').filter({ hasText: /.+/ });

  assignSaveButton = () => this.assignModal().getByRole('button', { name: FormsData.assignModal.saveButton });

  assignCancelButton = () => this.assignModal().getByRole('button', { name: FormsData.assignModal.cancelButton });

  assignDropdown = () => this.page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)');

  assignDropdownOptions = () => this.assignDropdown().locator('.ant-select-item-option');

  assignCheckboxes = () => this.assignDropdown().getByRole('checkbox');

  assignNoDataMessage = () => this.assignDropdown().getByText(FormsData.assignModal.noDataFound);

  toast = (text: string | RegExp) => this.page.locator('.ant-message-notice-content').filter({ hasText: text });

  // ── Table helpers ───────────────────────────────────────────────────────────

  async getVisibleFormNames(): Promise<string[]> {
    return this.getColumnValues('name');
  }

  async getColumnValues(column: FormTableColumn): Promise<string[]> {
    const colIndex = FORM_TABLE_COL[column];
    const rows = this.tableRows();
    const count = await rows.count();
    const values: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).locator('td').nth(colIndex).textContent();
      values.push(text?.trim() ?? '');
    }

    return values;
  }

  async getFirstFormName(): Promise<string> {
    const names = await this.getVisibleFormNames();
    expect(names.length).toBeGreaterThan(0);
    return names[0];
  }

  async hasMultiplePages(): Promise<boolean> {
    const nextDisabled = await this.nextPageButton().getAttribute('aria-disabled');
    const prevDisabled = await this.prevPageButton().getAttribute('aria-disabled');
    return !(nextDisabled === 'true' && prevDisabled === 'true');
  }

  async expectNoEmptyRows() {
    const rows = this.tableRows();
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      const name = await rows.nth(i).locator('td').nth(FORM_TABLE_COL.name).textContent();
      expect(name?.trim()).not.toBe('');
    }
  }

  async expectRowHoverHighlight(rowIndex = 0) {
    const row = this.tableRows().nth(rowIndex);
    await row.hover();
    const bg = await row.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');
  }

  async expectCellEllipsis(column: FormTableColumn, rowIndex = 0) {
    const cell = this.tableRows().nth(rowIndex).locator('td').nth(FORM_TABLE_COL[column]);
    const overflow = await cell.evaluate((el) => {
      const target = el.querySelector('.ellipsis, .text-ellipsis, span') ?? el;
      return getComputedStyle(target).textOverflow;
    });
    expect(['ellipsis', 'clip']).toContain(overflow);
  }

  async expectDescriptionShowsHyphenWhenEmpty() {
    const descriptions = await this.getColumnValues('description');
    const hasHyphen = descriptions.some((value) => value === '-' || value === '—');
    expect(hasHyphen || descriptions.some((value) => value === '')).toBeTruthy();
  }

  private waitForFormListResponse() {
    return this.page
      .waitForResponse(
        (resp) => resp.url().includes(FormsData.api.listPath) && resp.request().method() === 'GET',
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

  async searchForms(query: string) {
    if (!query) {
      if ((await this.searchInput().inputValue()).trim() === '') {
        return;
      }

      const response = this.waitForFormListResponse();
      await this.searchInput().fill('');
      await response;
      return;
    }

    const response = this.waitForFormListResponse();
    await this.searchInput().fill(query);
    if (await this.searchSubmitButton().isVisible().catch(() => false)) {
      await this.searchSubmitButton().click();
    } else {
      await this.searchInput().press('Enter');
    }
    await response;
    await this.waitForTableLoaded();
  }

  async clearSearch() {
    await this.searchForms('');
  }

  async expectSearchResultsMatch(term: string) {
    const names = await this.getColumnValues('name');
    const needle = term.toLowerCase();
    expect(names.every((name) => name.toLowerCase().includes(needle))).toBe(true);
  }

  async expectInvalidSearchShowsNoResults() {
    await expect(this.tableRows()).toHaveCount(0, { timeout: 15_000 });
  }

  async goToNextPage() {
    if ((await this.nextPageButton().getAttribute('aria-disabled')) === 'true') {
      return;
    }

    await this.waitForTableLoaded();
    const response = this.waitForFormListResponse();
    await this.nextPageButton().locator('button.ant-pagination-item-link').click();
    await response;
    await this.waitForTableLoaded();
  }

  async goToFirstPage() {
    if ((await this.prevPageButton().getAttribute('aria-disabled')) === 'true') {
      return;
    }

    await this.waitForTableLoaded();
    const response = this.waitForFormListResponse();
    await this.firstPageButton().click();
    await response;
    await this.waitForTableLoaded();
  }

  async goToPageNumber(num: number) {
    await this.waitForTableLoaded();
    const response = this.waitForFormListResponse();
    await this.pageNumber(num).click();
    await response;
    await this.waitForTableLoaded();
  }

  async isSortedByDateCreatedDesc(dates: string[]): Promise<boolean> {
    const parsed = dates.filter(Boolean).map((value) => new Date(value).getTime());
    if (parsed.length < 2 || parsed.some((value) => Number.isNaN(value))) {
      return true;
    }
    const sorted = [...parsed].sort((a, b) => b - a);
    return JSON.stringify(parsed) === JSON.stringify(sorted);
  }

  // ── Assign groups modal ─────────────────────────────────────────────────────

  async openAssignModal(formName: string) {
    await expect(this.assignButton(formName)).toBeVisible({ timeout: 15_000 });
    await this.assignButton(formName).click();
    await expect(this.assignModal()).toBeVisible({ timeout: 15_000 });
    await expect(this.assignModalTitle()).toContainText(formName, { timeout: 10_000 });
  }

  async openAssignGroupsDropdown() {
    await this.assignGroupsSelect().click();
    await expect(this.assignDropdown()).toBeVisible({ timeout: 15_000 });
  }

  async getAssignCheckboxLabels(): Promise<string[]> {
    return this.assignCheckboxes().evaluateAll((els) =>
      els.map((el) => (el.closest('label')?.textContent ?? el.textContent ?? '').trim()),
    );
  }

  async selectGroupInAssignDropdown(label: string | RegExp) {
    await this.openAssignGroupsDropdown();
    const checkbox = this.assignDropdown().getByRole('checkbox', { name: label });
    await expect(checkbox).toBeVisible({ timeout: 15_000 });
    await checkbox.click();
    await this.assignDropdown().getByRole('button', { name: /add/i }).click();
  }

  async unselectGroupInAssignDropdown(label: string | RegExp) {
    await this.openAssignGroupsDropdown();
    const checkbox = this.assignDropdown().getByRole('checkbox', { name: label });
    await expect(checkbox).toBeVisible({ timeout: 15_000 });
    if (await checkbox.isChecked()) {
      await checkbox.click();
    }
    await this.assignDropdown().getByRole('button', { name: /add/i }).click();
  }

  async removeSelectedGroupTag(label: string | RegExp) {
    const tag = this.assignModal().locator('button, .ant-select-selection-item').filter({ hasText: label });
    const closeIcon = tag.locator('.anticon-close, .crossIconCss, [aria-label="close"]').first();
    if (await closeIcon.isVisible().catch(() => false)) {
      await closeIcon.click();
    } else {
      await tag.click();
    }
  }

  async searchGroupsInAssignModal(term: string) {
    await this.openAssignGroupsDropdown();
    const searchInput = this.assignDropdown().locator('.ant-select-selection-search-input, input').first();
    const groupApi = this.page
      .waitForResponse((resp) => resp.url().includes('/group') && resp.request().method() === 'GET', {
        timeout: 30_000,
      })
      .catch(() => undefined);
    await searchInput.fill(term);
    await groupApi;
    await this.page.waitForTimeout(500);
  }

  async saveAssignModal(options: { waitForSuccess?: boolean } = {}) {
    const saveRequest = this.page
      .waitForResponse(
        (resp) => resp.url().includes('/form') && ['PUT', 'POST', 'PATCH'].includes(resp.request().method()),
        { timeout: 30_000 },
      )
      .catch(() => undefined);
    await this.assignSaveButton().click();
    await saveRequest;
    if (options.waitForSuccess ?? true) {
      await expect(this.assignModal()).toBeHidden({ timeout: 15_000 });
    }
  }

  async cancelAssignModal() {
    if (await this.assignCancelButton().isVisible().catch(() => false)) {
      await this.assignCancelButton().click();
    } else {
      await this.assignModalCloseIcon().click();
    }
    await expect(this.assignModal()).toBeHidden({ timeout: 15_000 });
  }

  async closeAssignModalWithX() {
    await this.assignModalCloseIcon().click();
    await expect(this.assignModal()).toBeHidden({ timeout: 15_000 });
  }

  async closeAssignModalByClickingOutside() {
    await this.page.mouse.click(5, 5);
    await expect(this.assignModal()).toBeHidden({ timeout: 15_000 });
  }

  async snapshotAssignedGroups(): Promise<string[]> {
    const tags = await this.assignModal()
      .locator('button')
      .evaluateAll((els) => els.map((el) => (el.textContent || '').trim()).filter(Boolean));
    this.savedAssignGroups = tags;
    return tags;
  }

  async prepareGroupFromApi(): Promise<ApiGroup> {
    const groups = await this.fetchGroupsFromApi({ size: 5 });
    expect(groups.length).toBeGreaterThan(0);
    return groups[0];
  }

  async expectAssignOptionHover(optionIndex = 0) {
    const option = this.assignDropdownOptions().nth(optionIndex);
    await option.hover();
    const bg = await option.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).not.toBe('rgba(0, 0, 0, 0)');
  }

  async expectAssignCheckboxLabelsUnique() {
    const labels = await this.getAssignCheckboxLabels();
    expect(new Set(labels).size).toBe(labels.length);
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

  /** GET /form/get/forms?page=0&size=10&sort=dateCreated,DESC — matches forms listing curl. */
  async fetchFormsFromApi(
    options: {
      page?: number;
      size?: number;
      sort?: string;
      search?: string;
    } = {},
  ): Promise<FormsApiResult> {
    const page = options.page ?? FormsData.api.defaultPage;
    const size = options.size ?? FormsData.api.defaultSize;
    const sort = options.sort ?? FormsData.api.defaultSort;
    const search = options.search ?? FormsData.api.defaultSearch;
    const query = `page=${page}&size=${size}&sort=${encodeURIComponent(sort)}&search=${encodeURIComponent(search)}`;

    const response = await this.page.request.get(`${this.apiBaseUrl}${FormsData.api.listPath}?${query}`, {
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok()) {
      throw new Error(`Forms API GET ${FormsData.api.listPath} failed with status ${response.status()}`);
    }

    const body = await response.json();
    const forms = this.extractForms(body);
    return {
      forms,
      total: this.extractFormTotal(body) || forms.length,
    };
  }

  async fetchGroupsFromApi(options: { page?: number; size?: number } = {}): Promise<ApiGroup[]> {
    const page = options.page ?? 0;
    const size = options.size ?? 50;
    const response = await this.page.request.get(`${this.apiBaseUrl}/group?page=${page}&size=${size}&search=`, {
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok()) {
      return [];
    }

    const body = await response.json();
    return this.extractGroups(body);
  }

  async expectUiMatchesApi() {
    const uiNames = await this.getVisibleFormNames();
    const api = await this.fetchFormsFromApi({ size: uiNames.length || FormsData.api.defaultSize });

    for (let i = 0; i < uiNames.length; i++) {
      const uiName = uiNames[i];
      const apiForm = api.forms[i];
      expect(apiForm?.name).toBe(uiName);

      const uiDescription = (await this.getColumnValues('description'))[i];
      const expectedDescription = apiForm?.description ? apiForm.description : '-';
      expect(uiDescription).toBe(expectedDescription || '-');
    }
  }

  formatApiDate(value: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private extractFormTotal(body: unknown): number {
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
      for (const key of ['totalElements', 'totalRecords', 'total', 'totalCount']) {
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

  private extractForms(body: unknown): ApiForm[] {
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
      for (const key of ['content', 'data', 'forms', 'items', 'records']) {
        if (Array.isArray(nested[key])) {
          items = nested[key] as unknown[];
          break;
        }
      }
    } else if (Array.isArray(record.content)) {
      items = record.content;
    }

    return items
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const form = item as Record<string, unknown>;
        const name =
          (typeof form.name === 'string' && form.name) ||
          (typeof form.formName === 'string' && form.formName) ||
          '';
        if (!name) {
          return null;
        }

        const id = String(form.id ?? form.formId ?? '');
        const description = typeof form.description === 'string' ? form.description : '';
        const dateCreated = String(
          form.dateCreated ?? form.createdAt ?? form.createdOn ?? form.date_created ?? '',
        );
        const dateUpdated = String(
          form.dateUpdated ?? form.updatedAt ?? form.updatedOn ?? form.date_updated ?? '',
        );

        return {
          id,
          name: name.trim(),
          description: description.trim(),
          dateCreated,
          dateUpdated,
          assignedGroupCount:
            typeof form.assignedGroupCount === 'number' ? form.assignedGroupCount : undefined,
        } satisfies ApiForm;
      })
      .filter((form): form is ApiForm => form !== null);
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
        if (!name || !code) {
          return null;
        }

        return {
          id: String(group.id ?? ''),
          name,
          code,
          userCount: typeof group.userCount === 'number' ? group.userCount : 0,
        } satisfies ApiGroup;
      })
      .filter((group): group is ApiGroup => group !== null);
  }
}
