import { expect, type Locator, type Page } from '@playwright/test';
import path from 'path';
import { MobileUsersData } from '../data/MobileUsersData';
import type { ApiGroup } from './GroupsPage';
import { ensureAuthenticated as restoreSession, isOnLoginPage } from '../utils/ensureAuthenticated';

export type MobileUserFormInput = {
  firstName?: string;
  lastName?: string;
  userName?: string;
  email?: string;
  password?: string;
  phone?: string;
  language?: string;
  deleteMsgYes?: boolean;
  roleHqYes?: boolean;
  dorakuCode?: string;
  statusActive?: boolean;
};

/** Mobile Users listing table column indices (icon column is index 0). */
export const MOBILE_USER_TABLE_COL = {
  icon: 0,
  userName: 1,
  name: 2,
  email: 3,
  groups: 4,
  deleteMsg: 5,
  roleHq: 6,
  approver: 7,
  status: 8,
  language: 9,
  createdOn: 10,
  actions: 11,
} as const;

export type MobileUserTableColumn = keyof typeof MOBILE_USER_TABLE_COL;

export type ApiMobileUserGroup = {
  id: string;
  name: string;
  code: string;
};

export type ApiMobileUser = {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  groups: ApiMobileUserGroup[];
  roles: { code: string; name: string }[];
};

export type MobileUsersApiResult = {
  users: ApiMobileUser[];
  total: number;
};

export class MobileUsersPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  async navigateToListing() {
    if (!this.isOnListingPage()) {
      await this.page.goto(MobileUsersData.paths.listing, {
        waitUntil: 'commit',
        timeout: 120_000,
      });
      await this.waitForListIfReady();
    }

    await this.ensureAuthenticated();

    if (!this.isOnListingPage()) {
      await this.page.goto(MobileUsersData.paths.listing, {
        waitUntil: 'commit',
        timeout: 120_000,
      });
      await this.waitForListIfReady();
    }

    await this.expectListingLoaded();
  }

  /** Re-login when storageState token was rejected and the app redirected to login. */
  async ensureAuthenticated() {
    await restoreSession(this.page);
  }

  private async waitForListIfReady() {
    if (await isOnLoginPage(this.page)) {
      return;
    }
    await this.waitForUserListResponse();
  }

  isOnListingPage(): boolean {
    const pathname = new URL(this.page.url()).pathname.replace(/\/$/, '');
    return pathname === MobileUsersData.paths.listing;
  }

  isOnCreatePage(): boolean {
    return new URL(this.page.url()).pathname.replace(/\/$/, '') === MobileUsersData.paths.create;
  }

  /** Fast path when the shared worker page is already on a ready Mobile Users list. */
  async ensureListingReady() {
    if (!this.isOnListingPage()) {
      await this.navigateToListing();
      return;
    }

    const [title, createVisible] = await Promise.all([
      this.page.locator('#pageTitle').textContent().catch(() => ''),
      this.createUserLink().isVisible().catch(() => false),
    ]);

    if (createVisible && title?.trim() === MobileUsersData.pageTitle) {
      return;
    }

    await this.expectListingLoaded();
  }

  private async isOnFirstPage(): Promise<boolean> {
    if (!(await this.pagination().isVisible().catch(() => false))) {
      return true;
    }
    return (await this.pagination().locator('.ant-pagination-prev').getAttribute('aria-disabled')) === 'true';
  }

  private async hasActiveSearch(): Promise<boolean> {
    return (await this.searchInput().inputValue()).trim() !== '';
  }

  private async isFilterApplied(): Promise<boolean> {
    return this.page.locator('.filterCss .tickMarkCss, .filledTickCss').first().isVisible().catch(() => false);
  }

  async goToFirstPage() {
    const prev = this.pagination().locator('.ant-pagination-prev');
    if ((await prev.getAttribute('aria-disabled')) === 'true') {
      return;
    }
    const response = this.waitForUserListResponse();
    await prev.click();
    await response;
    await expect(prev).toHaveAttribute('aria-disabled', 'true');
  }

  /** Return to listing, clear search/filters/pagination only when needed. */
  async resetAfterTest() {
    if (await this.confirmModal().isVisible().catch(() => false)) {
      await this.confirmModalAction(false).catch(() => undefined);
    }

    if (await this.filterModal().isVisible().catch(() => false)) {
      await this.page.keyboard.press('Escape').catch(() => undefined);
    }

    if (this.isOnCreatePage()) {
      await this.cancelButton().click().catch(() => undefined);
      await this.expectListingLoaded().catch(() => undefined);
    } else if (!this.isOnListingPage()) {
      await this.navigateToListing().catch(() => undefined);
      return;
    }

    if (await this.hasActiveSearch()) {
      await this.clearSearch().catch(() => undefined);
    }

    if (await this.isFilterApplied()) {
      await this.openFilterModal().catch(() => undefined);
      if (await this.filterModal().isVisible().catch(() => false)) {
        await this.clickFilterClearAll().catch(() => undefined);
        await this.applyFilter().catch(() => undefined);
      }
    }

    if (!(await this.isOnFirstPage())) {
      await this.goToFirstPage().catch(() => undefined);
    }
  }

  async navigateToCreateUser() {
    const settingsRequest = this.page
      .waitForResponse((resp) => resp.url().includes('/setting') || resp.url().includes('/settings'), {
        timeout: 30_000,
      })
      .catch(() => undefined);

    await this.page.goto(MobileUsersData.paths.create, {
      waitUntil: 'commit',
      timeout: 120_000,
    });
    await settingsRequest;
    await this.expectCreateFormLoaded();
  }

  async navigateToBulkUpload() {
    await this.page.goto(MobileUsersData.paths.bulkUpload, {
      waitUntil: 'commit',
      timeout: 120_000,
    });
    await this.expectBulkUploadPageLoaded();
  }

  async navigateToBulkUploadHistory() {
    await this.page.goto(MobileUsersData.paths.bulkUploadHistory, {
      waitUntil: 'commit',
      timeout: 120_000,
    });
    await this.expectBulkUploadHistoryLoaded();
  }

  async expectBulkUploadPageLoaded() {
    await expect(this.page.getByText(MobileUsersData.bulkUpload.pageHeading).first()).toBeVisible({
      timeout: 60_000,
    });
    await expect(this.bulkUploadFileInput()).toBeAttached({ timeout: 30_000 });
    await expect(this.bulkUploadSubmitButton()).toBeVisible({ timeout: 30_000 });
  }

  async expectBulkUploadHistoryLoaded() {
    await expect(this.page.locator('#pageTitle')).toHaveText(MobileUsersData.bulkUpload.historyPageTitle, {
      timeout: 60_000,
    });
    await expect(this.bulkUploadHistoryTable()).toBeVisible({ timeout: 30_000 });
  }

  async expectListingLoaded() {
    const loading = this.page.getByText('Loading...', { exact: true });
    const loadingVisible = await loading.isVisible().catch(() => false);

    if (loadingVisible) {
      await loading.waitFor({ state: 'hidden', timeout: 90_000 }).catch(async () => {
        await this.page.reload({ waitUntil: 'commit', timeout: 120_000 });
        await this.waitForUserListResponse();
      });
    }

    if (await isOnLoginPage(this.page)) {
      await this.ensureAuthenticated();
      if (!this.isOnListingPage()) {
        await this.page.goto(MobileUsersData.paths.listing, { waitUntil: 'commit', timeout: 120_000 });
        await this.waitForListIfReady();
      }
    }

    await expect(this.page.locator('#pageTitle')).toHaveText(MobileUsersData.pageTitle, {
      timeout: 90_000,
    });
    await expect(this.createUserLink()).toBeVisible({ timeout: 30_000 });
    await expect(this.searchInput()).toBeVisible({ timeout: 30_000 });
  }

  async expectCreateFormLoaded() {
    await expect(this.firstNameInput()).toBeVisible({ timeout: 90_000 });
    await expect(this.lastNameInput()).toBeVisible({ timeout: 30_000 });
  }

  async expectEditFormLoaded() {
    await expect(this.page.getByText(MobileUsersData.editPageTitle).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(this.userNameInput()).toBeDisabled();
  }

  // ── Listing locators ────────────────────────────────────────────────────────

  createUserLink = () => this.page.getByRole('link', { name: 'Create User' });

  bulkUploadLink = () => this.page.getByRole('link', { name: 'Bulk Upload' });

  bulkUploadFileInput = () => this.page.locator('input[type="file"]');

  bulkUploadSubmitButton = () => this.page.getByRole('button', { name: 'Upload', exact: true });

  bulkTemplateDownloadButton = () => this.page.getByRole('button', { name: 'Download', exact: true });

  bulkViewHistoryButton = () => this.page.getByRole('button', { name: 'View History' });

  bulkUploadRulesSection = () =>
    this.page.getByText('Please follow below rules while uploading the document');

  bulkUploadHistoryTable = () => this.page.locator('.ant-table').first();

  bulkUploadHistoryHeaders = () => this.bulkUploadHistoryTable().locator('.ant-table-thead th');

  bulkUploadHistoryRows = () => this.bulkUploadHistoryTable().locator('.ant-table-tbody tr.ant-table-row');

  bulkUploadHistoryRow = (fileName: string) =>
    this.bulkUploadHistoryRows().filter({ hasText: fileName }).first();

  searchInput = () => this.page.locator('.mobile-search-box-container input, [placeholder="Search"]').first();

  table = () => this.page.locator('.AdminUsersTable').first();

  tableRows = () => this.page.locator('.AdminUsersTable .ant-table-tbody tr.ant-table-row');

  tableHeaders = () => this.page.locator('.AdminUsersTable .ant-table-thead th');

  pagination = () => this.page.locator('.ant-pagination');

  paginationInfo = () => this.page.locator('.ant-pagination-total-text');

  filterButton = () => this.page.locator('.filterCss');

  filterModal = () => this.page.locator('.filterModal');

  drawer = () => this.page.locator('.adminDrawer');

  confirmModal = () => this.page.locator('.common-modal-box');

  userRow = (userName: string) =>
    this.tableRows().filter({
      has: this.page.locator('td').nth(MOBILE_USER_TABLE_COL.userName).getByText(userName, {
        exact: true,
      }),
    });

  editIcon = (userName: string) => this.userRow(userName).locator('.edit-icon');

  deleteIcon = (userName: string) => this.userRow(userName).locator('.delete-icon');

  sortHeader = (column: string) => this.page.locator('th').filter({ hasText: new RegExp(column, 'i') });

  nextPageButton = () => this.pagination().locator('.ant-pagination-next');

  pageNumber = (num: number) =>
    this.pagination().locator('.ant-pagination-item').filter({ hasText: String(num) });

  // ── Create / edit form locators ─────────────────────────────────────────────

  firstNameInput = () => this.page.locator('#firstName');

  lastNameInput = () => this.page.locator('#lastName');

  userNameInput = () => this.page.locator('#userName');

  emailInput = () => this.page.locator('#email');

  passwordInput = () => this.page.locator('#password');

  phoneInput = () => this.page.locator('#phone');

  dorakuInput = () => this.page.locator('#doraku_code');

  profileUploadInput = () => this.page.locator('.upload-image-css-mobile input[type="file"]');

  profileImage = () => this.page.locator('.mobile-body-image');

  submitButton = () => this.page.locator('.submit-button-mobile');

  cancelButton = () => this.page.locator('.cancel-button-mobile');

  resetPasswordButton = () => this.page.locator('.update-button-mobile');

  passwordEyeIcon = () => this.page.locator('.password-css .anticon-eye, .password-css .anticon-eye-invisible');

  groupSection = () => this.page.locator('.group-checkbox');

  hqGroupChip = () => this.groupSection().getByRole('button', { name: 'HQ' });

  groupSelect = () => this.groupSection().locator('.ant-select');

  fieldError = (text: string | RegExp) =>
    this.page.locator('[class*="textInput-module__info"], [class*="info"].error, .mobile-text-labels .error').filter({
      hasText: text,
    });

  toast = (text: string | RegExp) =>
    this.page.locator('.ant-message-notice-content').filter({ hasText: text });

  // ── API helpers ───────────────────────────────────────────────────────────

  private get apiBaseUrl(): string {
    const base = (process.env.BASE_URL ?? 'http://18.142.102.68').replace(/\/$/, '');
    return `${base}/api/user-management-service`;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.page.evaluate(() => localStorage.getItem('gulf_net_admin-token'));
    return {
      Authorization: `Bearer ${token ?? ''}`,
      'Content-Type': 'application/json',
      language: 'english',
      Accept: 'application/json, text/plain, */*',
    };
  }

  private async getMultipartAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.page.evaluate(() => localStorage.getItem('gulf_net_admin-token'));
    return {
      Authorization: `Bearer ${token ?? ''}`,
      language: 'english',
      Accept: 'application/json, text/plain, */*',
    };
  }

  private toApiLanguagePreference(language?: string): string {
    if (!language || /english/i.test(language)) {
      return 'eng';
    }
    if (/thai|ไทย/i.test(language)) {
      return 'tha';
    }
    if (/japanese|日本/i.test(language)) {
      return 'jpn';
    }
    return 'eng';
  }

  private extractTotalRecords(body: unknown): number {
    if (!body || typeof body !== 'object') {
      return 0;
    }

    const record = body as Record<string, unknown>;
    const metaData = record.metaData;

    if (metaData && typeof metaData === 'object') {
      const totalRecords = (metaData as { totalRecords?: unknown }).totalRecords;
      if (typeof totalRecords === 'number') {
        return totalRecords;
      }
    }

    const nestedData = record.data;
    if (nestedData && typeof nestedData === 'object' && !Array.isArray(nestedData)) {
      const nestedTotal = this.extractTotalRecords(nestedData);
      if (nestedTotal > 0) {
        return nestedTotal;
      }
    }

    if (typeof record.totalRecords === 'number') {
      return record.totalRecords;
    }

    if (typeof record.total === 'number') {
      return record.total;
    }

    return 0;
  }

  private extractMobileUsers(body: unknown): ApiMobileUser[] {
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
      if (Array.isArray(nested.data)) {
        items = nested.data;
      } else if (Array.isArray(nested.content)) {
        items = nested.content;
      } else if (Array.isArray(nested.users)) {
        items = nested.users;
      }
    } else if (Array.isArray(record.users)) {
      items = record.users;
    }

    return items
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const user = item as Record<string, unknown>;
        const userName = typeof user.userName === 'string' ? user.userName : '';
        const id = typeof user.id === 'string' ? user.id : '';

        if (!userName) {
          return null;
        }

        const groups = (Array.isArray(user.userGroups) ? user.userGroups : [])
          .map((groupItem) => {
            if (!groupItem || typeof groupItem !== 'object') {
              return null;
            }
            const group = groupItem as Record<string, unknown>;
            const name = typeof group.name === 'string' ? group.name : '';
            const code = typeof group.code === 'string' ? group.code : '';
            const groupId = typeof group.id === 'string' ? group.id : '';
            if (!name && !code) {
              return null;
            }
            return { id: groupId, name, code };
          })
          .filter((group): group is ApiMobileUserGroup => group !== null);

        const roles = (Array.isArray(user.userRole) ? user.userRole : [])
          .map((roleItem) => {
            if (!roleItem || typeof roleItem !== 'object') {
              return null;
            }
            const roleRecord = roleItem as Record<string, unknown>;
            const role = roleRecord.role;
            if (!role || typeof role !== 'object') {
              return null;
            }
            const roleObj = role as Record<string, unknown>;
            const code = typeof roleObj.code === 'string' ? roleObj.code : '';
            const name = typeof roleObj.name === 'string' ? roleObj.name : '';
            if (!code && !name) {
              return null;
            }
            return { code, name };
          })
          .filter((role): role is { code: string; name: string } => role !== null);

        return {
          id,
          userName,
          firstName: typeof user.firstName === 'string' ? user.firstName : '',
          lastName: typeof user.lastName === 'string' ? user.lastName : '',
          email: typeof user.email === 'string' ? user.email : '',
          status: typeof user.status === 'string' ? user.status : '',
          groups,
          roles,
        };
      })
      .filter((user): user is ApiMobileUser => user !== null);
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
        const name = typeof group.name === 'string' ? group.name : '';
        const code = typeof group.code === 'string' ? group.code : '';
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

  async fetchMobileUsers(
    options: {
      page?: number;
      size?: number;
      search?: string;
      filters?: { userGroups?: string[]; userRoles?: string[]; status?: string | null };
    } = {},
  ): Promise<MobileUsersApiResult> {
    const page = options.page ?? 0;
    const size = options.size ?? MobileUsersData.pagination.defaultPageSize;
    const search = options.search ?? '';
    const query = `page=${page}&size=${size}&search=${encodeURIComponent(search.trim())}`;

    const response = await this.page.request.fetch(`${this.apiBaseUrl}/user/mobile?${query}`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      data: { ...(options.filters ?? {}) },
    });

    if (!response.ok()) {
      throw new Error(`Mobile users API POST /user/mobile failed with status ${response.status()}`);
    }

    const body = await response.json();
    return {
      users: this.extractMobileUsers(body),
      total: this.extractTotalRecords(body),
    };
  }

  async getApiMobileUsersCount(): Promise<number> {
    const result = await this.fetchMobileUsers();
    return result.total;
  }

  async getApiListingUser(index = 0): Promise<ApiMobileUser> {
    const { users } = await this.fetchMobileUsers();
    const user = users[index];

    if (!user) {
      throw new Error(`No mobile user found at API index ${index}`);
    }

    return user;
  }

  async prepareUserFromApi(user: ApiMobileUser): Promise<ApiMobileUser> {
    await this.searchUsers(user.userName);
    await this.expectUserVisible(user.userName);
    return user;
  }

  async fetchGroups(options: { page?: number; size?: number } = {}): Promise<ApiGroup[]> {
    const page = options.page ?? 0;
    const size = options.size ?? 50;

    const response = await this.page.request.fetch(
      `${this.apiBaseUrl}/group?page=${page}&size=${size}&search=`,
      {
        method: 'GET',
        headers: await this.getAuthHeaders(),
        timeout: 60_000,
      },
    );

    if (!response.ok()) {
      throw new Error(`Groups API GET /group failed with status ${response.status()}`);
    }

    const body = await response.json();
    return this.extractGroups(body);
  }

  async getApiHqGroup(): Promise<ApiGroup> {
    const groups = await this.fetchGroups();
    const hqGroup = groups.find((group) => group.code === 'HQ' || group.name === 'HQ Group');

    if (!hqGroup) {
      throw new Error('HQ Group not found from API');
    }

    return hqGroup;
  }

  async getApiNonHqGroupWithMembers(
    options: { minUserCount?: number } = {},
  ): Promise<ApiGroup> {
    const groups = await this.fetchGroups();
    const minCount = options.minUserCount ?? 1;
    const withMembers = groups.filter(
      (group) =>
        group.userCount >= minCount && group.code !== 'HQ' && group.name !== 'HQ Group',
    );

    if (!withMembers.length) {
      throw new Error(`No non-HQ groups with at least ${minCount} member(s) found from API`);
    }

    return withMembers.sort((a, b) => b.userCount - a.userCount)[0];
  }

  private waitForUserListResponse() {
    return this.page
      .waitForResponse(
        (resp) => resp.url().includes('/user/mobile') && resp.request().method() === 'POST',
        { timeout: 30_000 },
      )
      .catch(() => undefined);
  }

  private waitForUserCreateResponse() {
    return this.page.waitForResponse(
      (resp) => {
        const url = resp.url();
        return (
          resp.request().method() === 'POST' &&
          /\/user-management-service\/user(?:\?|$)/.test(url) &&
          !url.includes('/user/mobile') &&
          !url.includes('/user/admin')
        );
      },
      { timeout: 60_000 },
    );
  }

  private waitForUserUpdateResponse() {
    return this.page.waitForResponse(
      (resp) => /\/user\/[^/]+$/.test(resp.url()) && resp.request().method() === 'PUT',
      { timeout: 30_000 },
    );
  }

  // ── Listing actions ─────────────────────────────────────────────────────────

  async clickCreateUser() {
    await this.createUserLink().click();
    await this.expectCreateFormLoaded();
  }

  async searchUsers(query: string) {
    const response = this.waitForUserListResponse();
    await this.searchInput().fill(query);
    if (query) {
      await this.searchInput().press('Enter');
    }
    await response;
    if (query.trim()) {
      await expect(this.tableRows().first()).toBeVisible({ timeout: 30_000 });
    }
  }

  async clearSearch() {
    await this.searchUsers('');
  }

  async getColumnValues(column: MobileUserTableColumn): Promise<string[]> {
    const colIndex = MOBILE_USER_TABLE_COL[column];
    const rows = this.tableRows();
    const count = await rows.count();
    const values: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).locator('td').nth(colIndex).textContent();
      values.push(text?.trim() ?? '');
    }
    return values;
  }

  async getTotalUserCount(): Promise<number> {
    const text = await this.paginationInfo().textContent({ timeout: 15_000 });
    const match = text?.match(/of\s+([\d,]+)\s+items/i);
    return match ? Number(match[1].replace(/,/g, '')) : 0;
  }

  async getVisibleRowCount(): Promise<number> {
    return this.tableRows().count();
  }

  async waitForListingRefresh() {
    await this.waitForUserListResponse();
  }

  async clickSort(column: string, order: 'asc' | 'desc' = 'asc') {
    const iconTitle = order === 'asc' ? 'Sort Ascending' : 'Sort Descending';
    await this.sortHeader(column).getByTitle(iconTitle).click();
    await this.waitForUserListResponse();
  }

  async openEditUser(userName: string) {
    await this.editIcon(userName).click();
    await this.expectEditFormLoaded();
  }

  async clickDeleteIcon(userName: string) {
    await this.deleteIcon(userName).click();
    await expect(this.confirmModal()).toBeVisible({ timeout: 10_000 });
  }

  async confirmModalAction(confirm = true) {
    const modal = this.confirmModal();
    await modal.getByRole('button', { name: confirm ? 'Yes' : 'Cancel' }).click();
    await this.waitForUserListResponse();
  }

  // ── Filter ──────────────────────────────────────────────────────────────────

  async openFilterModal() {
    await this.filterButton().click();
    await expect(this.filterModal()).toBeVisible({ timeout: 10_000 });
  }

  async selectFilterTab(tabName: 'Groups' | 'Roles' | 'Status') {
    await this.filterModal().getByText(tabName, { exact: true }).click();
  }

  async clickFilterSelectAll() {
    await this.filterModal().getByText('Select All', { exact: true }).click();
  }

  async clickFilterClearAll() {
    await this.filterModal().getByText('Clear All', { exact: true }).click();
  }

  async applyFilter() {
    const response = this.waitForUserListResponse();
    await this.filterModal().getByRole('button', { name: /Apply Filter/i }).click();
    await response;
    await expect(this.filterModal()).toBeHidden({ timeout: 15_000 });
  }

  async toggleFilterCheckbox(label: string) {
    await this.filterModal().locator('label').filter({ hasText: label }).click();
  }

  // ── Create / edit form actions ──────────────────────────────────────────────

  /** Clicks away from the active input so on-blur validation runs (form card / page title). */
  async triggerFieldValidation() {
    const formCard = this.page.locator('.create-mobile-form-div, .mobile-body-css').first();
    if (await formCard.isVisible().catch(() => false)) {
      await formCard.click({ position: { x: 8, y: 8 } });
      return;
    }
    await this.page.locator('#pageTitle').click();
  }

  async fillTextField(input: Locator, value: string) {
    await input.click();
    await input.fill(value);
    await this.triggerFieldValidation();
  }

  async selectRadioByLabel(fieldLabel: string | RegExp, option: 'Yes' | 'No') {
    const section = this.page.locator('.mobile-radio-lables').filter({ hasText: fieldLabel });
    await section.getByRole('radio', { name: option, exact: true }).check();
  }

  async selectLanguage(language: string) {
    await this.page
      .locator('.languagePreference, .languageClass')
      .getByRole('radio', { name: language })
      .check();
  }

  async selectStatus(active: boolean) {
    const label = active ? MobileUsersData.status.active : MobileUsersData.status.inactive;
    await this.page.locator('#status').locator('..').getByRole('radio', { name: label }).check();
  }

  async fillCreateUserForm(data: MobileUserFormInput) {
    if (data.firstName !== undefined) await this.fillTextField(this.firstNameInput(), data.firstName);
    if (data.lastName !== undefined) await this.fillTextField(this.lastNameInput(), data.lastName);
    if (data.userName !== undefined) await this.fillTextField(this.userNameInput(), data.userName);
    if (data.email !== undefined) await this.fillTextField(this.emailInput(), data.email);
    if (data.password !== undefined) await this.fillTextField(this.passwordInput(), data.password);
    if (data.phone !== undefined) await this.fillTextField(this.phoneInput(), data.phone);
    if (data.dorakuCode !== undefined) await this.fillTextField(this.dorakuInput(), data.dorakuCode);
    if (data.language) await this.selectLanguage(data.language);
    if (data.deleteMsgYes !== undefined) {
      await this.selectRadioByLabel(/Delete Message/i, data.deleteMsgYes ? 'Yes' : 'No');
    }
    if (data.roleHqYes !== undefined) {
      await this.selectRadioByLabel(/Role HQ/i, data.roleHqYes ? 'Yes' : 'No');
    }
    if (data.statusActive !== undefined) await this.selectStatus(data.statusActive);
  }

  async uploadProfilePhoto(filePath: string) {
    await this.profileUploadInput().setInputFiles(path.resolve(filePath));
  }

  async togglePasswordVisibility() {
    await this.passwordEyeIcon().click();
  }

  private async dismissToasts() {
    await this.page.evaluate(() => {
      document.querySelectorAll('.ant-message-notice').forEach((node) => node.remove());
    });
  }

  async submitCreateUser(options?: { waitForApi?: boolean }) {
    if (options?.waitForApi !== false) {
      await this.dismissToasts();
    }
    await this.submitButton().click();
    if (options?.waitForApi === false) {
      return;
    }
    await this.expectUserSavedSuccess();
  }

  async submitUpdateUser() {
    const updateRequest = this.waitForUserUpdateResponse();
    await this.submitButton().click();
    await updateRequest;
  }

  async cancelForm() {
    await this.cancelButton().click();
    await this.expectListingLoaded();
  }

  /** POST /user — multipart mobile user create (matches create-mobile-user curl). */
  async createMobileUserViaApi(
    data: MobileUserFormInput = MobileUsersData.buildValidUser(),
    options: { userGroup?: string } = {},
  ) {
    const userName = data.userName ?? '';
    const firstName = data.firstName ?? '';
    const lastName = data.lastName ?? '';
    const email = data.email ?? '';
    const password = data.password ?? '';

    if (!userName || !firstName || !lastName || !email || !password) {
      throw new Error('createMobileUserViaApi requires userName, firstName, lastName, email, and password');
    }

    const response = await this.page.request.post(`${this.apiBaseUrl}/user`, {
      headers: await this.getMultipartAuthHeaders(),
      multipart: {
        userName,
        firstName,
        lastName,
        email,
        phone: data.phone ?? '',
        languagePreference: this.toApiLanguagePreference(data.language),
        userRole: 'MOBILE',
        userGroup: options.userGroup ?? MobileUsersData.hqGroupCode,
        appType: 'MOBILE',
        password,
        dorakuUserCode: data.dorakuCode ?? '',
        status: data.statusActive === false ? '0' : '1',
        rewardBudget: '0',
      },
    });

    if (!response.ok()) {
      throw new Error(`Create mobile user API POST /user failed with status ${response.status()}`);
    }

    return data;
  }

  async createMobileUser(data: MobileUserFormInput = MobileUsersData.buildValidUser()) {
    if (this.isOnListingPage()) {
      await this.clickCreateUser();
    } else {
      await this.navigateToCreateUser();
    }
    await this.fillCreateUserForm(data);
    await this.triggerFieldValidation();
    await this.submitCreateUser();
    return data;
  }

  async addGroupFromDropdown(group: { code: string; name: string }) {
    await this.groupSelect().click();
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

  // ── Assertions ──────────────────────────────────────────────────────────────

  async expectUserSavedSuccess() {
    await expect(this.toast(MobileUsersData.messages.userSaved)).toBeVisible({ timeout: 60_000 });
    await expect(this.page).toHaveURL(new RegExp(MobileUsersData.paths.listing), { timeout: 60_000 });
  }

  async expectValidationMessage(text: string | RegExp) {
    await expect(this.fieldError(text).first().or(this.toast(text).first())).toBeVisible({
      timeout: 15_000,
    });
  }

  async expectUploadError(message: string | RegExp) {
    await expect(this.toast(message).first()).toBeVisible({ timeout: 20_000 });
  }

  // ── Bulk upload actions ─────────────────────────────────────────────────────

  private waitForBulkUploadResponse() {
    return this.page.waitForResponse(
      (resp) => resp.url().includes('/user/bulkUpload') && resp.request().method() === 'POST',
      { timeout: 180_000 },
    );
  }

  async openBulkUploadFromListing() {
    await this.bulkUploadLink().click();
    await this.page.waitForURL(/bulk-upload/, { timeout: 60_000 });
    await this.expectBulkUploadPageLoaded();
  }

  async openBulkUploadHistoryFromPage() {
    await this.bulkViewHistoryButton().click();
    await this.page.waitForURL(/bulk-upload-history/, { timeout: 60_000 });
    await this.expectBulkUploadHistoryLoaded();
  }

  async selectBulkUploadFile(filePath: string) {
    await this.bulkUploadFileInput().setInputFiles(path.resolve(filePath));
  }

  async clickBulkUploadSubmit() {
    await this.bulkUploadSubmitButton().click();
  }

  async uploadBulkCsv(filePath: string) {
    const uploadRequest = this.waitForBulkUploadResponse();
    await this.selectBulkUploadFile(filePath);
    await this.clickBulkUploadSubmit();
    return uploadRequest;
  }

  async downloadBulkTemplate() {
    const downloadPromise = this.page.waitForEvent('download', { timeout: 60_000 });
    await this.bulkTemplateDownloadButton().click();
    return downloadPromise;
  }

  async expectBulkUploadRuleVisible(rule: string | RegExp) {
    await expect(this.page.getByText(rule).first()).toBeVisible({ timeout: 15_000 });
  }

  async expectBulkUploadRulesVisible() {
    for (const rule of MobileUsersData.bulkUpload.rules) {
      await this.expectBulkUploadRuleVisible(rule);
    }
  }

  async expectBulkUploadFieldRulesVisible() {
    const pageText = await this.page.locator('body').innerText();
    for (const rule of MobileUsersData.bulkUpload.fieldRules) {
      expect(pageText).toMatch(rule.pattern);
    }
  }

  async expectBulkUploadHistoryColumnVisible(column: string) {
    await expect(this.bulkUploadHistoryHeaders().filter({ hasText: column })).toBeVisible();
  }

  async expectBulkUploadHistoryColumnsVisible() {
    for (const column of MobileUsersData.bulkUpload.historyColumns) {
      await this.expectBulkUploadHistoryColumnVisible(column);
    }
  }

  async waitForBulkUploadHistoryRow(fileName: string, options: { timeout?: number } = {}) {
    const timeout = options.timeout ?? 120_000;
    await expect
      .poll(async () => this.bulkUploadHistoryRow(fileName).count(), { timeout })
      .toBeGreaterThan(0);
    return this.bulkUploadHistoryRow(fileName);
  }

  async downloadHistoryUploadedFile(fileName: string) {
    const row = await this.waitForBulkUploadHistoryRow(fileName);
    const downloadPromise = this.page.waitForEvent('download', { timeout: 60_000 });
    await row.locator('td').nth(1).locator('a, button, [class*="download"], img, svg').first().click();
    return downloadPromise;
  }

  async downloadHistoryErrorReport(fileName: string) {
    const row = await this.waitForBulkUploadHistoryRow(fileName);
    const downloadPromise = this.page.waitForEvent('download', { timeout: 60_000 });
    await row.locator('td').last().locator('a, button, [class*="download"], img, svg').first().click();
    return downloadPromise;
  }

  async expectBulkUploadProcessed() {
    await expect(this.toast(MobileUsersData.bulkUpload.messages.processed).first()).toBeVisible({
      timeout: 60_000,
    });
  }

  async expectBulkUploadRejected(message: string | RegExp) {
    await expect(
      this.toast(message).first().or(this.page.getByText(message).first()),
    ).toBeVisible({ timeout: 30_000 });
  }

  async expectUserVisible(userName: string) {
    await expect(this.userRow(userName)).toBeVisible({ timeout: 30_000 });
  }

  async expectUserNotVisible(userName: string) {
    await expect(this.userRow(userName)).toHaveCount(0);
  }

  async expectFormFieldVisible(fieldLabel: string | RegExp) {
    await expect(this.page.locator('.mobile-label, .mobile-text-labels, .mobile-radio-lables').filter({
      hasText: fieldLabel,
    })).toBeVisible();
  }

  async expectColumnHeaderVisible(header: string) {
    await expect(this.tableHeaders().filter({ hasText: header })).toBeVisible();
  }

  async expectHqGroupAssigned() {
    await expect(this.hqGroupChip()).toBeVisible();
  }

  async expectPasswordFieldVisible(visible: boolean) {
    if (visible) {
      await expect(this.passwordInput()).toBeVisible();
    } else {
      await expect(this.passwordInput()).toHaveCount(0);
    }
  }

  async expectPasswordMasked() {
    await expect(this.passwordInput()).toHaveAttribute('type', 'password');
  }

  async expectPasswordUnmasked() {
    await expect(this.passwordInput()).toHaveAttribute('type', 'text');
  }
}
