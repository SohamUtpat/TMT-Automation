import { expect, type Locator, type Page } from '@playwright/test';

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

export class GroupsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  async navigateToGroups() {
    if (!/\/groups(?:\/|$|\?)/.test(this.page.url())) {
      const groupApi = this.page
        .waitForResponse(
          (resp) => resp.url().includes('/group') && resp.request().method() === 'GET',
          { timeout: 120_000 },
        )
        .catch(() => undefined);
      await this.page.goto('/groups', { waitUntil: 'commit', timeout: 120_000 });
      await groupApi;
    }
    await this.expectGroupsLoaded();
  }

  async expectGroupsLoaded() {
    await expect(this.createGroupButton()).toBeVisible({ timeout: 90_000 });
    await expect(this.page.locator('#pageTitle')).toHaveText('Groups', { timeout: 30_000 });
    await expect(this.searchInput()).toBeVisible({ timeout: 30_000 });
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

  pageNumber = (num: number) =>
    this.pagination().locator('.ant-pagination-item').filter({ hasText: String(num) });

  prevPageButton = () => this.pagination().locator('.ant-pagination-prev');

  nextPageButton = () => this.pagination().locator('.ant-pagination-next');

  /** Double-left icon rendered inside the prev control (TableView custom pagination). */
  firstPageButton = () => this.pagination().locator('.ant-pagination-prev .anticon-double-left');

  /** Double-right icon rendered inside the next control (TableView custom pagination). */
  lastPageButton = () => this.pagination().locator('.ant-pagination-next .anticon-double-right');

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

  async searchGroups(query: string) {
    if (!query) {
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
    await this.page.waitForTimeout(300);
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

  async openCreateGroupModal() {
    await this.createGroupButton().click();
    await expect(this.createModal()).toBeVisible();
  }

  async fillCreateForm(name: string, code: string) {
    const modal = this.createModal();
    const nameInput = this.modalNameInput(modal);
    const codeInput = this.modalCodeInput(modal);

    await nameInput.click();
    await nameInput.fill(name);
    await nameInput.press('Tab');

    await codeInput.click();
    await codeInput.fill(code);
    await codeInput.press('Tab');
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
    await cancelBtn.click({ force: true });
    await expect(modal).toBeHidden({ timeout: 15_000 });
  }

  async createGroup(name: string, code: string) {
    await this.openCreateGroupModal();
    await this.fillCreateForm(name, code);
    await this.submitCreateAndWait();
  }

  async openEditGroup(groupName: string) {
    await this.editButton(groupName).click();
    await expect(this.editModal()).toBeVisible();
  }

  async updateGroupName(newName: string) {
    const modal = this.editModal();
    await this.modalNameInput(modal).fill('');
    await this.modalNameInput(modal).fill(newName);
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
    await this.page.waitForTimeout(1000);
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

  // ── Members page ────────────────────────────────────────────────────────────

  async openMembersList(groupName: string) {
    const membersRequest = this.page.waitForResponse(
      (resp) => resp.url().includes('/user/mobile') && resp.request().method() === 'POST',
      { timeout: 30_000 },
    );
    await this.memberCountLink(groupName).click();
    await membersRequest;
    await expect(this.backButton()).toBeVisible({ timeout: 15_000 });
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
