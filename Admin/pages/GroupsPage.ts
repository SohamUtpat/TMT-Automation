import { expect, type Locator, type Page } from '@playwright/test';
import { ensureAuthenticated as restoreSession } from '../utils/ensureAuthenticated';

/** Groups table column indices — first column is the group icon. */
export const GROUP_TABLE_COL = {
  icon: 0,
  name: 1,
  code: 2,
  createdOn: 3,
  members: 4,
  actions: 5,
} as const;

export type GroupTableColumn = keyof typeof GROUP_TABLE_COL;

export type ApiGroup = {
  id: string;
  name: string;
  code: string;
  userCount: number;
};

export class GroupsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  isOnGroupsListPage(): boolean {
    const pathname = new URL(this.page.url()).pathname.replace(/\/$/, '');
    return pathname === '/groups';
  }

  async navigateToGroups() {
    if (!this.isOnGroupsListPage()) {
      const groupApi = this.waitForGroupListResponse();
      await this.page.goto('/groups', { waitUntil: 'commit', timeout: 60_000 });
      await groupApi;
    }
    await this.ensureAuthenticated();
    if (!this.isOnGroupsListPage()) {
      const groupApi = this.waitForGroupListResponse();
      await this.page.goto('/groups', { waitUntil: 'commit', timeout: 60_000 });
      await groupApi;
    }
    await this.expectGroupsTitle();
  }

  /** Re-login when storageState token was rejected and the app redirected to login. */
  async ensureAuthenticated() {
    await restoreSession(this.page);
  }

  /** Fast path when the shared worker page is already on a ready Groups list. */
  async ensureGroupsReady() {
    if (!this.isOnGroupsListPage()) {
      await this.navigateToGroups();
      return;
    }

    await this.ensureAuthenticated();
    await this.expectGroupsTitle();
  }

  async expectGroupsTitle() {
    await expect(this.page.locator('#pageTitle')).toHaveText('Groups', { timeout: 15_000 });
  }

  async expectGroupsLoaded() {
    const loading = this.page.getByText('Loading...', { exact: true });
    const loadingVisible = await loading.isVisible().catch(() => false);

    if (loadingVisible) {
      await loading.waitFor({ state: 'hidden', timeout: 90_000 }).catch(async () => {
        await this.page.reload({ waitUntil: 'commit', timeout: 120_000 });
        await this.waitForGroupListResponse();
      });
    }

    await expect(this.createGroupButton()).toBeVisible({ timeout: 30_000 });
    await expect(this.page.locator('#pageTitle')).toHaveText('Groups', { timeout: 15_000 });
    await expect(this.searchInput()).toBeVisible({ timeout: 15_000 });
    await expect(this.table()).toBeVisible({ timeout: 15_000 });
  }

  private async isOnFirstPage(): Promise<boolean> {
    return (await this.prevPageButton().getAttribute('aria-disabled')) === 'true';
  }

  private async hasActiveSearch(): Promise<boolean> {
    return (await this.searchInput().inputValue()).trim() !== '';
  }

  /** Close modals, return to list view, and reset search/pagination only when needed. */
  async resetAfterTest() {
    const createModal = this.createModal();
    if (await createModal.isVisible().catch(() => false)) {
      await this.cancelCreate().catch(() => undefined);
    }

    const editModal = this.editModal();
    if (await editModal.isVisible().catch(() => false)) {
      await this.cancelEdit().catch(() => undefined);
    }

    const deleteModal = this.deleteConfirmModal();
    if (await deleteModal.isVisible().catch(() => false)) {
      await this.cancelDelete().catch(() => undefined);
    }

    const blockedModal = this.deleteBlockedModal();
    if (await blockedModal.isVisible().catch(() => false)) {
      await this.dismissBlockedDelete().catch(() => undefined);
    }

    if (!this.isOnGroupsListPage()) {
      await this.navigateToGroups().catch(() => undefined);
      return;
    }

    if (await this.hasActiveSearch()) {
      await this.clearSearch().catch(() => undefined);
    }

    if (!(await this.isOnFirstPage())) {
      await this.goToFirstPage().catch(() => undefined);
    }
  }

  // ── List page locators ──────────────────────────────────────────────────────

  createGroupButton = () => this.page.getByRole('button', { name: 'Create Group' });

  searchInput = () => this.page.getByPlaceholder('Search');

  table = () => this.page.locator('.ant-table');

  tableRows = () => this.page.locator('.ant-table-tbody tr.ant-table-row');

  groupRow = (name: string) =>
    this.tableRows().filter({
      has: this.page
        .locator('td')
        .nth(GROUP_TABLE_COL.name)
        .getByText(name, { exact: true }),
    });

  sortHeader = (column: string) =>
    this.page.locator('th').filter({ hasText: new RegExp(column, 'i') });

  pagination = () => this.page.locator('.ant-pagination');

  paginationInfo = () => this.page.locator('.ant-pagination-total-text');

  pageNumber = (num: number) => this.pagination().locator(`.ant-pagination-item-${num}`);

  prevPageButton = () => this.pagination().locator('.ant-pagination-prev');

  nextPageButton = () => this.pagination().locator('.ant-pagination-next');

  /** Double-left icon rendered inside the prev control (TableView custom pagination). */
  firstPageButton = () => this.pagination().getByRole('img', { name: 'double-left' });

  /** Double-right icon rendered inside the next control (TableView custom pagination). */
  lastPageButton = () => this.pagination().getByRole('img', { name: 'double-right' });

  async hasMultiplePages(): Promise<boolean> {
    const nextDisabled = await this.nextPageButton().getAttribute('aria-disabled');
    const prevDisabled = await this.prevPageButton().getAttribute('aria-disabled');
    return !(nextDisabled === 'true' && prevDisabled === 'true');
  }

  async goToLastPage() {
    if ((await this.nextPageButton().getAttribute('aria-disabled')) === 'true') {
      return;
    }

    await this.waitForTableLoaded();
    const response = this.waitForGroupListResponse();
    await this.lastPageButton().click();
    await response;
    await this.waitForTableLoaded();
    await expect(this.nextPageButton()).toHaveAttribute('aria-disabled', 'true');
  }

  async goToFirstPage() {
    if ((await this.prevPageButton().getAttribute('aria-disabled')) === 'true') {
      return;
    }

    await this.waitForTableLoaded();
    const response = this.waitForGroupListResponse();
    await this.firstPageButton().click();
    await response;
    await this.waitForTableLoaded();
    await expect(this.prevPageButton()).toHaveAttribute('aria-disabled', 'true');
    await expect(this.pageNumber(1)).toHaveClass(/ant-pagination-item-active/);
  }

  async goToNextPage() {
    if ((await this.nextPageButton().getAttribute('aria-disabled')) === 'true') {
      return;
    }

    await this.waitForTableLoaded();
    const response = this.waitForGroupListResponse();
    await this.nextPageButton().locator('button.ant-pagination-item-link').click();
    await response;
    await this.waitForTableLoaded();
  }

  async goToPageNumber(num: number) {
    await this.waitForTableLoaded();
    const response = this.waitForGroupListResponse();
    await this.pageNumber(num).click();
    await response;
    await this.waitForTableLoaded();
    await expect(this.pageNumber(num)).toHaveClass(/ant-pagination-item-active/);
  }

  // ── Modal locators ─────────────────────────────────────────────────────────

  createModal = () =>
    this.page.locator('.ant-modal').filter({ hasText: 'Create New Group' });

  editModal = () =>
    this.page.locator('.ant-modal').filter({ hasText: 'Edit Group Details' });

  deleteConfirmModal = () =>
    this.page.locator('.common-modal-box, .ant-modal').filter({
      hasText: /Are you sure you want to delete group/,
    });

  deleteBlockedModal = () =>
    this.page.locator('.ant-modal').filter({
      hasText: /Delete Group/,
    });

  modalNameInput = (modal: Locator) => modal.getByPlaceholder('Type here').first();

  modalCodeInput = (modal: Locator) => modal.getByPlaceholder('Type here').nth(1);

  profilePhotoInput = (modal: Locator = this.createModal()) =>
    modal.locator('input[type="file"]');

  cameraButton = (modal: Locator = this.createModal()) =>
    modal.locator('.camera-icon, .group-modal-body-image-camera img').first();

  // ── Row actions (frontend uses img.edit-icon / img.delete-icon inside buttons) ─

  editButton = (groupName: string) =>
    this.groupRow(groupName).locator('button .edit-icon').first();

  deleteButton = (groupName: string) =>
    this.groupRow(groupName).locator('button .delete-icon').first();

  memberCountLink = (groupName: string) =>
    this.groupRow(groupName).locator('td').nth(GROUP_TABLE_COL.members).locator('a.link-text-css');

  // ── Members page locators ───────────────────────────────────────────────────

  backButton = () => this.page.getByRole('button', { name: 'Back' });

  membersPageTitle = (groupName: string) =>
    this.page.locator('.header-title').filter({ hasText: groupName });

  removeUsersButton = () => this.page.getByRole('button', { name: 'Remove Users' });

  membersSearchInput = () => this.page.getByPlaceholder('Search');

  memberRows = () => this.page.locator('.ant-table-tbody tr.ant-table-row');

  memberCheckbox = (index: number) => this.memberRows().nth(index).locator('input[type="checkbox"]');

  selectAllMembersCheckbox = () =>
    this.page.locator('.ant-table-thead input[type="checkbox"]').first();

  removeUsersConfirmModal = () =>
    this.page.locator('.common-modal-box').filter({
      hasText: /remove users from this group/i,
    });

  // ── Table helpers ─────────────────────────────────────────────────────────

  async getVisibleGroupNames(): Promise<string[]> {
    return this.getColumnValues('name');
  }

  async getColumnValues(column: GroupTableColumn): Promise<string[]> {
    const colIndex = GROUP_TABLE_COL[column];
    const rows = this.tableRows();
    const count = await rows.count();
    const values: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await rows.nth(i).locator('td').nth(colIndex).textContent();
      values.push(text?.trim() ?? '');
    }

    return values;
  }

  async getMemberCount(groupName: string): Promise<number> {
    const cell = this.groupRow(groupName).locator('td').nth(GROUP_TABLE_COL.members);
    const text = await cell.textContent();
    return Number(text?.trim() ?? '0');
  }

  private async waitForGroupListResponse() {
    await this.page
      .waitForResponse(
        (resp) => resp.url().includes('/group') && resp.request().method() === 'GET',
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

  async searchGroups(query: string) {
    if (!query) {
      if ((await this.searchInput().inputValue()).trim() === '') {
        return;
      }

      const response = this.waitForGroupListResponse();
      await this.searchInput().fill('');
      await response;
      return;
    }

    const response = this.waitForGroupListResponse();
    await this.searchInput().fill(query);
    await this.searchInput().press('Enter');
    await response;
    await expect(this.tableRows().first()).toBeVisible({ timeout: 15_000 });
  }

  async clearSearch() {
    await this.searchGroups('');
  }

  async clickSort(column: string, order: 'asc' | 'desc' = 'asc') {
    const iconTitle = order === 'asc' ? 'Sort Ascending' : 'Sort Descending';
    await this.sortHeader(column).getByTitle(iconTitle).click();
    await this.waitForGroupListResponse();
    await this.waitForTableLoaded();
  }

  async isSortedAscending(values: string[], column?: GroupTableColumn): Promise<boolean> {
    if (column === 'createdOn') return this.isSortedDates(values, 'asc');
    const sorted = [...values].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    return JSON.stringify(values) === JSON.stringify(sorted);
  }

  async isSortedDescending(values: string[], column?: GroupTableColumn): Promise<boolean> {
    if (column === 'createdOn') return this.isSortedDates(values, 'desc');
    const sorted = [...values].sort((a, b) => b.localeCompare(a, undefined, { sensitivity: 'base' }));
    return JSON.stringify(values) === JSON.stringify(sorted);
  }

  private isSortedDates(values: string[], direction: 'asc' | 'desc'): boolean {
    const dates = values.filter(Boolean).map((v) => new Date(v).getTime());
    if (dates.length === 0 || dates.some((d) => Number.isNaN(d))) return false;
    const sorted = [...dates].sort((a, b) => (direction === 'asc' ? a - b : b - a));
    return JSON.stringify(dates) === JSON.stringify(sorted);
  }

  async expectSearchResultsMatch(term: string) {
    const names = await this.getColumnValues('name');
    const codes = await this.getColumnValues('code');
    const needle = term.toLowerCase();

    expect(
      names.every(
        (name, index) =>
          name.toLowerCase().includes(needle) || codes[index].toLowerCase().includes(needle),
      ),
    ).toBe(true);
  }

  // ── Create / Edit group ─────────────────────────────────────────────────────

  private async waitForCreateModalReady() {
    const modal = this.createModal();
    await expect(modal).toBeVisible({ timeout: 15_000 });
    await modal.locator('.ant-modal-content').waitFor({ state: 'visible', timeout: 15_000 });
    await modal
      .locator('.ant-zoom-enter-active')
      .waitFor({ state: 'detached', timeout: 10_000 })
      .catch(() => undefined);

    const nameInput = this.modalNameInput(modal);
    await expect(nameInput).toBeVisible({ timeout: 15_000 });
    await expect(nameInput).toBeEnabled({ timeout: 15_000 });
  }

  private async fillModalInput(input: Locator, value: string) {
    await expect(input).toBeVisible({ timeout: 15_000 });
    await expect(input).toBeEnabled({ timeout: 15_000 });
    await input.fill(value);
    await input.press('Tab');
  }

  async openCreateGroupModal() {
    await expect(this.createGroupButton()).toBeEnabled({ timeout: 15_000 });
    await this.createGroupButton().click();
    await this.waitForCreateModalReady();
  }

  async fillCreateForm(name: string, code: string) {
    const modal = this.createModal();
    await this.waitForCreateModalReady();
    await this.fillModalInput(this.modalNameInput(modal), name);
    await this.fillModalInput(this.modalCodeInput(modal), code);
  }

  async fillCreateGroupName(name: string) {
    const modal = this.createModal();
    await this.waitForCreateModalReady();
    await this.fillModalInput(this.modalNameInput(modal), name);
  }

  async submitCreate() {
    await this.createModal().getByRole('button', { name: 'Create', exact: true }).click();
  }

  async submitCreateAndWait() {
    const createRequest = this.page.waitForResponse(
      (resp) => resp.url().includes('/group') && resp.request().method() === 'POST',
      { timeout: 30_000 },
    );
    await this.submitCreate();
    await createRequest;
    await this.createModal()
      .waitFor({ state: 'hidden', timeout: 30_000 })
      .catch(() => undefined);
    await this.waitForGroupListResponse();
  }

  async submitCreateAndExpectDuplicate() {
    const modal = this.createModal();
    const createRequest = this.page.waitForResponse(
      (resp) => resp.url().includes('/group') && resp.request().method() === 'POST',
      { timeout: 30_000 },
    );
    await this.submitCreate();
    const response = await createRequest;
    const body = (await response.json().catch(() => ({}))) as {
      status?: number;
      errors?: Array<{ errorMessage?: string }>;
    };

    // A successful create closes the modal; duplicate submission must keep it open.
    await expect(modal).toBeVisible({ timeout: 15_000 });

    const apiRejected = response.status() >= 400 || body.status === 1;
    const errorMessage = body.errors?.[0]?.errorMessage;

    if (apiRejected) {
      expect(apiRejected).toBeTruthy();
      if (errorMessage) {
        await expect(
          this.page.locator('.ant-message-notice-content').filter({ hasText: errorMessage }).first(),
        ).toBeVisible({ timeout: 15_000 });
      }
      return;
    }

    await expect(modal.getByRole('button', { name: 'Create', exact: true })).toBeDisabled();
  }

  async cancelCreate() {
    const modal = this.createModal();
    const cancelBtn = modal.getByRole('button', { name: 'Cancel', exact: true });
    await expect(cancelBtn).toBeVisible({ timeout: 10_000 });
    await expect(cancelBtn).toBeEnabled({ timeout: 10_000 });
    await cancelBtn.click();
    await expect(modal).toBeHidden({ timeout: 15_000 });
  }

  async createGroup(name: string, code: string) {
    await this.openCreateGroupModal();
    await this.fillCreateForm(name, code);
    await this.submitCreateAndWait();
    await this.searchGroups(name);
  }

  async openEditGroup(groupName: string) {
    await this.editButton(groupName).click();
    await expect(this.editModal()).toBeVisible();
  }

  async updateGroupName(newName: string) {
    const modal = this.editModal();
    await expect(modal).toBeVisible({ timeout: 15_000 });
    const nameInput = this.modalNameInput(modal);
    await expect(nameInput).toBeVisible({ timeout: 15_000 });
    await nameInput.fill('');
    await nameInput.fill(newName);
    await modal.getByRole('button', { name: 'Update' }).click();
    await this.waitForGroupListResponse();
  }

  async cancelEdit() {
    await this.editModal().getByRole('button', { name: 'Cancel' }).click();
  }

  async uploadProfilePhoto(filePath: string) {
    const modal = this.createModal();
    const input = modal.locator('.group-modal-body-image-camera input[type="file"]');
    await input.setInputFiles(filePath);
    await expect(modal.locator('.group-modal-body-image')).toBeVisible({ timeout: 5_000 });
  }

  async expectUploadError(message: string | RegExp) {
    await expect(
      this.page.locator('.ant-message-notice-content').filter({ hasText: message }).first(),
    ).toBeVisible({ timeout: 20_000 });
  }

  // ── Delete group ────────────────────────────────────────────────────────────

  async clickDeleteGroup(groupName: string) {
    await this.deleteButton(groupName).click();
  }

  async confirmDelete() {
    await this.deleteConfirmModal().getByRole('button', { name: 'Yes' }).click();
    await this.waitForGroupListResponse();
  }

  async cancelDelete() {
    await this.deleteConfirmModal().getByRole('button', { name: 'Cancel' }).click();
  }

  async dismissBlockedDelete() {
    await this.deleteBlockedModal().getByRole('button', { name: 'OK' }).click();
  }

  async deleteGroupIfPossible(groupName: string) {
    const deleteBtn = this.deleteButton(groupName);
    if (await deleteBtn.isVisible().catch(() => false)) {
      await deleteBtn.click();
      const confirmVisible = await this.deleteConfirmModal()
        .isVisible({ timeout: 2000 })
        .catch(() => false);
      if (confirmVisible) {
        await this.confirmDelete();
      } else {
        const blocked = await this.deleteBlockedModal()
          .isVisible({ timeout: 2000 })
          .catch(() => false);
        if (blocked) await this.dismissBlockedDelete();
      }
    }
  }

  // ── API helpers ─────────────────────────────────────────────────────────────

  private get apiBaseUrl(): string {
    const base = (process.env.BASE_URL ?? 'http://18.142.102.68').replace(/\/$/, '');
    return `${base}/api/user-management-service`;
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

  async fetchGroups(options: { page?: number; size?: number } = {}): Promise<ApiGroup[]> {
    const page = options.page ?? 0;
    const size = options.size ?? 200;
    const token = await this.page.evaluate(() => localStorage.getItem('gulf_net_admin-token'));

    const response = await this.page.request.fetch(
      `${this.apiBaseUrl}/group?page=${page}&size=${size}&search=`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token ?? ''}`,
          language: 'english',
          Accept: 'application/json, text/plain, */*',
        },
      },
    );

    if (!response.ok()) {
      throw new Error(`Groups API GET /group failed with status ${response.status()}`);
    }

    const body = await response.json();
    return this.extractGroups(body);
  }

  /** Returns a group with userCount > 0 from the groups API. */
  async getApiGroupWithMembers(
    options: { excludeHq?: boolean; minUserCount?: number } = {},
  ): Promise<ApiGroup> {
    const groups = await this.fetchGroups();
    const minCount = options.minUserCount ?? 1;
    let withMembers = groups.filter((group) => group.userCount >= minCount);

    if (options.excludeHq) {
      withMembers = withMembers.filter(
        (group) => group.code !== 'HQ' && group.name !== 'HQ Group',
      );
    }

    if (!withMembers.length) {
      throw new Error(`No groups with at least ${minCount} member(s) found from API`);
    }

    return withMembers.sort((a, b) => b.userCount - a.userCount)[0];
  }

  /** First group from the API where userCount > 0 (HQ excluded — no delete action). */
  async getApiFirstGroupWithMembers(
    options: { excludeHq?: boolean } = { excludeHq: true },
  ): Promise<ApiGroup> {
    const groups = await this.fetchGroups();
    const group = groups.find((entry) => {
      if (entry.userCount <= 0) {
        return false;
      }
      if (
        options.excludeHq &&
        (entry.code === 'HQ' || entry.name === 'HQ Group')
      ) {
        return false;
      }
      return true;
    });

    if (!group) {
      throw new Error('No group with userCount > 0 found from API');
    }

    return group;
  }

  async getApiHqGroup(): Promise<ApiGroup> {
    const groups = await this.fetchGroups();
    const hqGroup = groups.find((group) => group.code === 'HQ' || group.name === 'HQ Group');

    if (!hqGroup) {
      throw new Error('HQ Group not found from API');
    }

    return hqGroup;
  }

  async prepareGroupFromApi(group: ApiGroup): Promise<ApiGroup> {
    await this.searchGroups(group.name);
    await expect(this.groupRow(group.name)).toBeVisible({ timeout: 30_000 });
    return group;
  }

  async prepareHqGroupFromApi(): Promise<ApiGroup> {
    return this.prepareGroupFromApi(await this.getApiHqGroup());
  }

  /** Search and locate a group from the API before opening its members list. */
  async prepareGroupWithMembersFromApi(
    options: { excludeHq?: boolean; minUserCount?: number } = {},
  ): Promise<ApiGroup> {
    return this.prepareGroupFromApi(await this.getApiGroupWithMembers(options));
  }

  // ── Members page ────────────────────────────────────────────────────────────

  async openMembersList(groupName: string, options: { minimal?: boolean } = {}) {
    const membersRequest = this.page.waitForResponse(
      (resp) => resp.url().includes('/user/mobile') && resp.request().method() === 'POST',
      { timeout: 30_000 },
    );
    await this.memberCountLink(groupName).click();
    await membersRequest;
    await expect(this.backButton()).toBeVisible({ timeout: 15_000 });

    if (options.minimal) {
      return;
    }

    await expect(this.membersPageTitle(groupName)).toBeVisible({ timeout: 15_000 });
    await expect(this.memberRows().first()).toBeVisible({ timeout: 30_000 });
  }

  async goBackToGroups() {
    await this.backButton().click();
    await this.expectGroupsLoaded();
  }

  async getMembersTotalCount(): Promise<number> {
    const text = await this.paginationInfo().textContent({ timeout: 15_000 });
    const match = text?.match(/of\s+([\d,]+)\s+items/i);
    return match ? Number(match[1].replace(/,/g, '')) : 0;
  }

  async selectMemberByIndex(index: number) {
    const checkbox = this.memberCheckbox(index);
    await checkbox.scrollIntoViewIfNeeded();
    await checkbox.check({ force: true });
  }

  async selectAllMembers() {
    await this.selectAllMembersCheckbox().check();
  }

  async removeSelectedMembers() {
    await this.removeUsersButton().click();
    const modal = this.removeUsersConfirmModal();
    await expect(modal).toBeVisible({ timeout: 5000 });
    const membersRequest = this.page.waitForResponse(
      (resp) => resp.url().includes('/user/mobile') && resp.request().method() === 'POST',
      { timeout: 30_000 },
    );
    await modal.getByRole('button', { name: 'Yes' }).click();
    await membersRequest;
  }

  // ── Validation helpers ──────────────────────────────────────────────────────

  async expectValidationMessage(text: string | RegExp) {
    const modal = this.createModal();
    const fieldError = modal
      .locator('[class*="textInput-module__info"], [class*="info"], .group-error')
      .filter({ hasText: text });
    const toast = this.page.locator('.ant-message-notice-content').filter({ hasText: text });

    await expect(fieldError.first().or(toast.first())).toBeVisible({ timeout: 15_000 });
    await expect(modal).toBeVisible();
  }

  async expectRequiredFieldMarkers(modal: Locator) {
    await expect(modal.locator('.label-style').filter({ hasText: 'Name' }).locator('.group-error')).toHaveText('*');
    await expect(modal.locator('.label-style').filter({ hasText: 'Code' }).locator('.group-error')).toHaveText('*');
  }

  async expectGroupVisible(name: string) {
    await expect(this.groupRow(name)).toBeVisible({ timeout: 30_000 });
  }

  async expectGroupNotVisible(name: string) {
    await expect(this.groupRow(name)).toHaveCount(0);
  }
}
