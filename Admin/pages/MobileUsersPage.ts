import { expect, type Locator, type Page } from '@playwright/test';
import path from 'path';
import { MobileUsersData } from '../data/MobileUsersData';

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
  status: 7,
  language: 8,
  createdOn: 9,
  actions: 10,
} as const;

export type MobileUserTableColumn = keyof typeof MOBILE_USER_TABLE_COL;

export class MobileUsersPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  async navigateToListing() {
    if (!/\/mobile-users(?:\/|$|\?)/.test(this.page.url())) {
      const listRequest = this.waitForUserListResponse();
      await this.page.goto(MobileUsersData.paths.listing, {
        waitUntil: 'commit',
        timeout: 120_000,
      });
      await listRequest;
    }
    await this.expectListingLoaded();
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
    await expect(this.page.getByText('Bulk Upload').first()).toBeVisible({ timeout: 30_000 });
  }

  async expectListingLoaded() {
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

  searchInput = () => this.page.locator('.mobile-search-box-container input, [placeholder="Search"]').first();

  table = () => this.page.locator('.AdminUsersTable .ant-table, .ant-table').first();

  tableRows = () => this.page.locator('.ant-table-tbody tr.ant-table-row');

  tableHeaders = () => this.page.locator('.ant-table-thead th');

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

  hqGroupChip = () => this.page.locator('.hq_style');

  groupSelect = () => this.groupSection().locator('.ant-select');

  fieldError = (text: string | RegExp) =>
    this.page.locator('[class*="textInput-module__info"], [class*="info"].error, .mobile-text-labels .error').filter({
      hasText: text,
    });

  toast = (text: string | RegExp) =>
    this.page.locator('.ant-message-notice-content').filter({ hasText: text });

  // ── API helpers ───────────────────────────────────────────────────────────

  private waitForUserListResponse() {
    return this.page
      .waitForResponse(
        (resp) => resp.url().includes('/user/mobile') && resp.request().method() === 'POST',
        { timeout: 120_000 },
      )
      .catch(() => undefined);
  }

  private waitForUserCreateResponse() {
    return this.page.waitForResponse(
      (resp) => resp.url().includes('/user') && resp.request().method() === 'POST',
      { timeout: 30_000 },
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

  async fillTextField(input: Locator, value: string) {
    await input.click();
    await input.fill(value);
    await input.press('Tab');
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

  async submitCreateUser() {
    const createRequest = this.waitForUserCreateResponse();
    await this.submitButton().click();
    await createRequest;
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

  async createMobileUser(data: MobileUserFormInput = MobileUsersData.buildValidUser()) {
    await this.navigateToCreateUser();
    await this.fillCreateUserForm(data);
    await this.submitCreateUser();
    await this.expectUserSavedSuccess();
    return data;
  }

  async addGroupFromDropdown(searchText: string) {
    await this.groupSelect().click();
    const dropdown = this.page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)');
    if (searchText) {
      await dropdown.locator('input').fill(searchText);
    }
    await dropdown.locator('.custumCheckDropdown').first().click();
    await this.page.getByRole('button', { name: 'Add', exact: true }).click();
  }

  // ── Assertions ──────────────────────────────────────────────────────────────

  async expectUserSavedSuccess() {
    await expect(this.toast(MobileUsersData.messages.userSaved)).toBeVisible({ timeout: 20_000 });
    await expect(this.page).toHaveURL(new RegExp(MobileUsersData.paths.listing), { timeout: 30_000 });
  }

  async expectValidationMessage(text: string | RegExp) {
    await expect(this.fieldError(text).first().or(this.toast(text).first())).toBeVisible({
      timeout: 15_000,
    });
  }

  async expectUploadError(message: string | RegExp) {
    await expect(this.toast(message).first()).toBeVisible({ timeout: 20_000 });
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
