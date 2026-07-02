import { expect, type Locator, type Page } from '@playwright/test';
import path from 'path';
import { AdminUsersData } from '../data/AdminUsersData';
import { ensureAuthenticated as restoreSession, isOnLoginPage } from '../utils/ensureAuthenticated';

export type AdminUserFormInput = {
  firstName?: string;
  lastName?: string;
  userName?: string;
  email?: string;
  phone?: string;
  language?: string;
  dorakuYes?: boolean;
  statusActive?: boolean;
};

/** Admin Users listing table column indices (icon column is index 0). */
export const ADMIN_USER_TABLE_COL = {
  icon: 0,
  userName: 1,
  name: 2,
  email: 3,
  status: 4,
  language: 5,
  createdOn: 6,
  actions: 7,
} as const;

export type AdminUserTableColumn = keyof typeof ADMIN_USER_TABLE_COL;

export type ApiAdminUser = {
  id: string;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  languagePreference?: string;
  phone?: string;
  dorakuEnable?: boolean;
};

export type AdminUsersApiResult = {
  users: ApiAdminUser[];
  total: number;
};

export class AdminUsersPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  async navigateToListing() {
    if (!this.isOnListingPage()) {
      await this.page.goto(AdminUsersData.paths.listing, {
        waitUntil: 'commit',
        timeout: 120_000,
      });
      await this.waitForListIfReady();
    }

    await this.ensureAuthenticated();

    if (!this.isOnListingPage()) {
      await this.page.goto(AdminUsersData.paths.listing, {
        waitUntil: 'commit',
        timeout: 120_000,
      });
      await this.waitForListIfReady();
    }

    await this.expectListingLoaded();
  }

  async ensureAuthenticated() {
    await restoreSession(this.page);
  }

  private async waitForListIfReady() {
    if (await isOnLoginPage(this.page)) {
      return;
    }
    await this.waitForAdminListResponse();
  }

  isOnListingPage(): boolean {
    const pathname = new URL(this.page.url()).pathname.replace(/\/$/, '');
    return pathname === AdminUsersData.paths.listing;
  }

  isOnCreatePage(): boolean {
    return new URL(this.page.url()).pathname.replace(/\/$/, '') === AdminUsersData.paths.create;
  }

  async ensureListingReady() {
    if (!this.isOnListingPage()) {
      await this.navigateToListing();
      return;
    }

    const [title, createVisible] = await Promise.all([
      this.page.locator('#pageTitle').textContent().catch(() => ''),
      this.createUserLink().isVisible().catch(() => false),
    ]);

    if (createVisible && title?.trim() === AdminUsersData.pageTitle) {
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

  async goToFirstPage() {
    const prev = this.pagination().locator('.ant-pagination-prev');
    if ((await prev.getAttribute('aria-disabled')) === 'true') {
      return;
    }
    const response = this.waitForAdminListResponse();
    await prev.click();
    await response;
    await expect(prev).toHaveAttribute('aria-disabled', 'true');
  }

  async resetAfterTest() {
    if (await this.confirmModal().isVisible().catch(() => false)) {
      await this.confirmModalAction(false).catch(() => undefined);
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

    await this.page.goto(AdminUsersData.paths.create, {
      waitUntil: 'commit',
      timeout: 120_000,
    });
    await settingsRequest;
    await this.expectCreateFormLoaded();
  }

  async expectListingLoaded() {
    const loading = this.page.getByText('Loading...', { exact: true });
    const loadingVisible = await loading.isVisible().catch(() => false);

    if (loadingVisible) {
      await loading.waitFor({ state: 'hidden', timeout: 90_000 }).catch(async () => {
        await this.page.reload({ waitUntil: 'commit', timeout: 120_000 });
        await this.waitForAdminListResponse();
      });
    }

    if (await isOnLoginPage(this.page)) {
      await this.ensureAuthenticated();
      if (!this.isOnListingPage()) {
        await this.page.goto(AdminUsersData.paths.listing, { waitUntil: 'commit', timeout: 120_000 });
        await this.waitForListIfReady();
      }
    }

    await expect(this.page.locator('#pageTitle')).toHaveText(AdminUsersData.pageTitle, {
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
    await expect(this.page.getByText(AdminUsersData.editPageTitle).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(this.userNameInput()).toBeDisabled();
  }

  // ── Listing locators ────────────────────────────────────────────────────────

  createUserLink = () => this.page.getByRole('link', { name: 'Create User' });

  searchInput = () => this.page.locator('.admin-search-box-container input, [placeholder="Search"]').first();

  table = () => this.page.locator('.AdminUsersTable').first();

  tableRows = () => this.page.locator('.AdminUsersTable .ant-table-tbody tr.ant-table-row');

  tableHeaders = () => this.page.locator('.AdminUsersTable .ant-table-thead th');

  pagination = () => this.page.locator('.ant-pagination');

  paginationInfo = () => this.page.locator('.ant-pagination-total-text');

  drawer = () => this.page.locator('.adminDrawer');

  confirmModal = () => this.page.locator('.common-modal-box');

  userRow = (userName: string) =>
    this.tableRows().filter({
      has: this.page.locator('td').nth(ADMIN_USER_TABLE_COL.userName).getByText(userName, {
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

  phoneInput = () => this.page.locator('#phone');

  profileUploadInput = () => this.page.locator('.upload-image-css input[type="file"], .upload-image-css-admin input[type="file"]').first();

  profileImage = () => this.page.locator('.admin-body-image, .upload-image-css img').first();

  submitButton = () => this.page.locator('.admin-submit-button');

  cancelButton = () => this.page.locator('.admin-cancel-button');

  statusRadioGroup = () => this.page.locator('#status');

  fieldError = (text: string | RegExp) =>
    this.page.locator('[class*="textInput-module__info"], [class*="info"].error, .admin-text-labels .error').filter({
      hasText: text,
    });

  toast = (text: string | RegExp) =>
    this.page.locator('.ant-message-notice-content').filter({ hasText: text });

  // ── API helpers ─────────────────────────────────────────────────────────────

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

  private extractAdminUsers(body: unknown): ApiAdminUser[] {
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

        return {
          id,
          userName,
          firstName: typeof user.firstName === 'string' ? user.firstName : '',
          lastName: typeof user.lastName === 'string' ? user.lastName : '',
          email: typeof user.email === 'string' ? user.email : '',
          status: typeof user.status === 'string' ? user.status : '',
          languagePreference:
            typeof user.languagePreference === 'string' ? user.languagePreference : undefined,
          phone: typeof user.phone === 'string' ? user.phone : undefined,
          dorakuEnable: typeof user.dorakuEnable === 'boolean' ? user.dorakuEnable : undefined,
        };
      })
      .filter((user): user is ApiAdminUser => user !== null);
  }

  /** POST /user/admin?page=0&size=25&search= with {} body — matches admin listing curl. */
  async fetchAdminUsers(
    options: { page?: number; size?: number; search?: string } = {},
  ): Promise<AdminUsersApiResult> {
    const page = options.page ?? 0;
    const size = options.size ?? AdminUsersData.pagination.defaultPageSize;
    const search = options.search ?? '';
    const query = `page=${page}&size=${size}&search=${encodeURIComponent(search.trim())}`;

    const response = await this.page.request.fetch(`${this.apiBaseUrl}/user/admin?${query}`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      data: {},
    });

    if (!response.ok()) {
      throw new Error(`Admin users API POST /user/admin failed with status ${response.status()}`);
    }

    const body = await response.json();
    return {
      users: this.extractAdminUsers(body),
      total: this.extractTotalRecords(body),
    };
  }

  async getApiAdminUsersCount(): Promise<number> {
    const result = await this.fetchAdminUsers();
    return result.total;
  }

  async getApiListingUser(index = 0): Promise<ApiAdminUser> {
    const { users } = await this.fetchAdminUsers();
    const user = users[index];

    if (!user) {
      throw new Error(`No admin user found at API index ${index}`);
    }

    return user;
  }

  async getApiUserByStatus(status: '1' | '2'): Promise<ApiAdminUser> {
    const { users } = await this.fetchAdminUsers({ size: 100 });
    const user = users.find((item) => item.status === status);

    if (!user) {
      throw new Error(`No admin user with status ${status} found from API`);
    }

    return user;
  }

  async prepareUserFromApi(user: ApiAdminUser): Promise<ApiAdminUser> {
    await this.searchUsers(user.userName);
    await this.expectUserVisible(user.userName);
    return user;
  }

  async getLoggedInAdmin(): Promise<{ id: string; userName: string }> {
    const info = await this.page.evaluate(() => {
      const raw = localStorage.getItem('gulf_net_admin-userInfo');
      if (!raw) {
        return null;
      }
      try {
        return JSON.parse(raw) as { id?: string; userName?: string };
      } catch {
        return null;
      }
    });

    if (!info?.id || !info?.userName) {
      throw new Error('Logged-in admin user info not found in localStorage');
    }

    return { id: info.id, userName: info.userName };
  }

  mapApiStatus(status: string): string {
    switch (status) {
      case '1':
        return AdminUsersData.status.active;
      case '2':
        return AdminUsersData.status.inactive;
      default:
        return status;
    }
  }

  mapApiLanguage(languagePreference?: string): string {
    switch (languagePreference) {
      case 'eng':
        return AdminUsersData.languages.english;
      case 'thai':
        return AdminUsersData.languages.thai;
      case 'jpn':
        return AdminUsersData.languages.japanese;
      default:
        return AdminUsersData.languages.english;
    }
  }

  private waitForAdminListResponse() {
    return this.page
      .waitForResponse(
        (resp) => resp.url().includes('/user/admin') && resp.request().method() === 'POST',
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
    const response = this.waitForAdminListResponse();
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

  async getColumnValues(column: AdminUserTableColumn): Promise<string[]> {
    const colIndex = ADMIN_USER_TABLE_COL[column];
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
    await this.waitForAdminListResponse();
  }

  async clickSort(column: string, order: 'asc' | 'desc' = 'asc') {
    const iconTitle = order === 'asc' ? 'Sort Ascending' : 'Sort Descending';
    await this.sortHeader(column).getByTitle(iconTitle).click();
    await this.waitForAdminListResponse();
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
    await this.waitForAdminListResponse();
  }

  async expectUserVisible(userName: string) {
    await expect(this.userRow(userName)).toBeVisible({ timeout: 30_000 });
  }

  async expectFormFieldVisible(label: string | RegExp) {
    await expect(this.page.locator('label, .admin-text-labels').filter({ hasText: label }).first()).toBeVisible();
  }

  async dismissToasts() {
    const closeButtons = this.page.locator('.ant-message-notice .anticon-close');
    const count = await closeButtons.count();
    for (let i = 0; i < count; i++) {
      await closeButtons.nth(i).click().catch(() => undefined);
    }
  }

  // ── Create / edit form actions ──────────────────────────────────────────────

  async fillTextField(input: Locator, value: string) {
    await input.click();
    await input.fill(value);
    await input.press('Tab');
  }

  async selectRadioByLabel(fieldLabel: string | RegExp, option: 'Yes' | 'No') {
    const section = this.page.locator('.admin-radio-lables, .admin-radio-labels').filter({ hasText: fieldLabel });
    await section.getByRole('radio', { name: option, exact: true }).check();
  }

  async selectLanguage(language: string) {
    await this.page
      .locator('.languagePreference, .languageClass')
      .getByRole('radio', { name: language, exact: true })
      .check();
  }

  async selectStatus(active: boolean) {
    const label = active ? AdminUsersData.status.active : AdminUsersData.status.inactive;
    await this.page.locator('#status').getByRole('radio', { name: label, exact: true }).check();
  }

  async fillCreateUserForm(data: AdminUserFormInput) {
    if (data.firstName !== undefined) {
      await this.fillTextField(this.firstNameInput(), data.firstName);
    }
    if (data.lastName !== undefined) {
      await this.fillTextField(this.lastNameInput(), data.lastName);
    }
    if (data.userName !== undefined) {
      await this.fillTextField(this.userNameInput(), data.userName);
    }
    if (data.email !== undefined) {
      await this.fillTextField(this.emailInput(), data.email);
    }
    if (data.phone !== undefined) {
      await this.fillTextField(this.phoneInput(), data.phone);
    }
    if (data.language) {
      await this.selectLanguage(data.language);
    }
    if (data.dorakuYes !== undefined) {
      const dorakuVisible = await this.page
        .locator('.admin-radio-lables, .admin-radio-labels')
        .filter({ hasText: /Doraku/i })
        .isVisible()
        .catch(() => false);
      if (dorakuVisible) {
        await this.selectRadioByLabel(/Doraku/i, data.dorakuYes ? 'Yes' : 'No');
      }
    }
    if (data.statusActive !== undefined && (await this.statusRadioGroup().isVisible().catch(() => false))) {
      await this.selectStatus(data.statusActive);
    }
  }

  async uploadProfilePhoto(filePath: string) {
    await this.profileUploadInput().setInputFiles(path.resolve(filePath));
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

  async submitUpdateUser(options?: { waitForApi?: boolean }) {
    if (options?.waitForApi !== false) {
      await this.dismissToasts();
    }
    const updateRequest = options?.waitForApi === false ? undefined : this.waitForUserUpdateResponse();
    await this.submitButton().click();
    if (updateRequest) {
      await updateRequest.catch(async () => {
        await expect(this.toast(AdminUsersData.messages.userSaved)).toBeVisible({ timeout: 60_000 });
      });
    }
  }

  async cancelForm() {
    await this.cancelButton().click();
    await this.expectListingLoaded();
  }

  async createAdminUser(data: AdminUserFormInput = AdminUsersData.buildValidUser()) {
    if (this.isOnListingPage()) {
      await this.clickCreateUser();
    } else {
      await this.navigateToCreateUser();
    }
    await this.fillCreateUserForm(data);
    await this.submitCreateUser();
    return data;
  }

  // ── Assertions ──────────────────────────────────────────────────────────────

  async expectUserSavedSuccess() {
    await expect(this.toast(AdminUsersData.messages.userSaved)).toBeVisible({ timeout: 60_000 });
    await expect(this.page).toHaveURL(new RegExp(AdminUsersData.paths.listing), { timeout: 60_000 });
  }

  async expectValidationMessage(text: string | RegExp) {
    await expect(this.fieldError(text).first().or(this.toast(text).first())).toBeVisible({
      timeout: 15_000,
    });
  }

  async expectUploadError(message: string | RegExp) {
    await expect(this.toast(message).first()).toBeVisible({ timeout: 20_000 });
  }

  async expectUserNotVisible(userName: string) {
    await expect(this.userRow(userName)).toHaveCount(0);
  }

  async expectColumnHeaderVisible(header: string) {
    await expect(this.tableHeaders().filter({ hasText: header })).toBeVisible();
  }
}
