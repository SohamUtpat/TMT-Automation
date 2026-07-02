import { expect, type Locator, type Page } from '@playwright/test';
import path from 'path';
import { SettingsData } from '../data/SettingsData';
import { ensureAuthenticated as restoreSession } from '../utils/ensureAuthenticated';

export type ApiSettings = {
  url: string;
  email: string;
  contact_details: string;
  CHANGE_LANGUAGE: string;
};

export type ApiStamp = {
  id: string;
  stampUrl: string;
  status: string;
};

export type StampsApiResult = {
  stamps: ApiStamp[];
  total: number;
};

export class SettingsPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  supportDetailsSection = () => this.page.locator('.setting-description');

  stampsSection = () => this.page.locator('.stamp-details');

  supportEditIcon = () => this.supportDetailsSection().locator('img[src*="edit_icon"]');

  seeAllStampsButton = () => this.page.getByRole('button', { name: /see all/i });

  uploadNewStampButton = () => this.page.getByRole('button', { name: /upload new/i });

  settingsModal = () => this.page.locator('.ant-modal');

  urlInput = () => this.page.locator('#url');

  emailInput = () => this.page.locator('#email');

  contactInput = () => this.page.locator('#contact_details');

  updateButton = () => this.settingsModal().getByRole('button', { name: /^update$/i });

  uploadButton = () => this.settingsModal().getByRole('button', { name: /^upload$/i });

  cancelModalButton = () => this.settingsModal().getByRole('button', { name: /^cancel$/i });

  backButton = () => this.settingsModal().getByRole('button', { name: /^back$/i });

  stampUploadInput = () => this.settingsModal().locator('input[type="file"]');

  stampPreviewImages = () => this.page.locator('.stamp-container .stamp, .stamp-list .stamp-image');

  stampDeleteIcons = () => this.settingsModal().locator('.stamp-edit');

  stampImagesInModal = () => this.settingsModal().locator('img.stamp, .stamp-image, .stamp-list img');

  uploadError = () => this.page.locator('.setting-error');

  toast = (text: string | RegExp) => this.page.locator('.ant-message-notice-content').filter({ hasText: text });

  fieldError = (text: string | RegExp) =>
    this.page.locator('[class*="info"], .setting-field, .setting-error').filter({ hasText: text });

  supportUrlLink = () => this.supportDetailsSection().locator('a[href]').first();

  async navigateToSettings() {
    if (!this.isOnSettingsPage()) {
      const settingsApi = this.waitForSettingsResponse();
      await this.page.goto(SettingsData.path, { waitUntil: 'commit', timeout: 120_000 });
      await settingsApi;
    }
    await this.expectSettingsLoaded();
  }

  isOnSettingsPage(): boolean {
    return new URL(this.page.url()).pathname.replace(/\/$/, '') === SettingsData.path;
  }

  async ensureSettingsReady() {
    if (!this.isOnSettingsPage()) {
      await this.navigateToSettings();
      return;
    }
    await this.expectSettingsLoaded();
  }

  async expectSettingsLoaded() {
    const loading = this.page.getByText('Loading...', { exact: true });
    if (await loading.isVisible().catch(() => false)) {
      await loading.waitFor({ state: 'hidden', timeout: 90_000 }).catch(() => undefined);
    }
    await expect(this.page.locator('#pageTitle')).toHaveText(SettingsData.pageTitle, { timeout: 60_000 });
    await expect(this.supportDetailsSection()).toBeVisible({ timeout: 30_000 });
    await expect(this.stampsSection()).toBeVisible({ timeout: 30_000 });
  }

  private waitForSettingsResponse() {
    return this.page
      .waitForResponse((resp) => resp.url().includes('/settings') && resp.request().method() === 'GET', {
        timeout: 30_000,
      })
      .catch(() => undefined);
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
      'Content-Type': 'application/json',
      language: 'english',
      Accept: 'application/json, text/plain, */*',
    };
  }

  async fetchSettingsFromApi(): Promise<ApiSettings> {
    const response = await this.page.request.get(`${this.apiBaseUrl}/settings`, {
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok()) {
      throw new Error(`Settings API GET /settings failed with status ${response.status()}`);
    }

    const body = await response.json();
    const data = this.extractSettingsRecord(body);
    return {
      url: data?.supportUrl?.trim() ?? '',
      email: data?.supportEmail?.trim() ?? '',
      contact_details: data?.supportPhoneNumber?.trim() ?? '',
      CHANGE_LANGUAGE: data?.languagePreference ?? SettingsData.languages.english.code,
    };
  }

  private extractSettingsRecord(body: unknown): Record<string, string> | null {
    if (!body || typeof body !== 'object') {
      return null;
    }

    const record = body as Record<string, unknown>;
    const data = record.data;

    if (Array.isArray(data) && data[0] && typeof data[0] === 'object') {
      return data[0] as Record<string, string>;
    }

    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return data as Record<string, string>;
    }

    return null;
  }

  /** GET /settings/stamp?version=2&type={type}&page=0&size=25 — type 0 = Standard, type 1 = Approval. */
  async fetchStampsFromApi(
    options: { page?: number; size?: number; type?: number; version?: number } = {},
  ): Promise<StampsApiResult> {
    const page = options.page ?? SettingsData.stamps.api.page;
    const size = options.size ?? SettingsData.stamps.api.size;
    const type = options.type ?? SettingsData.stamps.types.standard;
    const version = options.version ?? SettingsData.stamps.api.version;
    const query = `version=${version}&type=${type}&page=${page}&size=${size}`;

    const response = await this.page.request.get(`${this.apiBaseUrl}/settings/stamp?${query}`, {
      headers: await this.getAuthHeaders(),
    });

    if (!response.ok()) {
      throw new Error(`Stamps API GET /settings/stamp failed with status ${response.status()}`);
    }

    const body = await response.json();
    const stamps = this.extractStamps(body);
    return {
      stamps,
      total: this.extractStampTotal(body) || stamps.length,
    };
  }

  /** GET /settings/stamp?version=2&type=1&page=0&size=25 — Approval Stamps tab. */
  async fetchApprovalStampsFromApi(
    options: { page?: number; size?: number; version?: number } = {},
  ): Promise<StampsApiResult> {
    return this.fetchStampsFromApi({ ...options, type: SettingsData.stamps.types.approval });
  }

  /** GET /settings/stamp?version=2&type=0&page=0&size=25 — Standard Stamps tab. */
  async fetchStandardStampsFromApi(
    options: { page?: number; size?: number; version?: number } = {},
  ): Promise<StampsApiResult> {
    return this.fetchStampsFromApi({ ...options, type: SettingsData.stamps.types.standard });
  }

  private extractStampTotal(body: unknown): number {
    if (!body || typeof body !== 'object') {
      return 0;
    }

    const record = body as Record<string, unknown>;
    if (typeof record.total === 'number') {
      return record.total;
    }

    const metaData = record.metaData;
    if (metaData && typeof metaData === 'object') {
      const totalRecords = (metaData as { totalRecords?: unknown }).totalRecords;
      if (typeof totalRecords === 'number') {
        return totalRecords;
      }
    }

    return 0;
  }

  private extractStamps(body: unknown): ApiStamp[] {
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
      } else if (Array.isArray(nested.stamps)) {
        items = nested.stamps;
      }
    }

    return items
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const stamp = item as Record<string, unknown>;
        const id = typeof stamp.id === 'string' ? stamp.id : '';
        if (!id) {
          return null;
        }

        return {
          id,
          stampUrl: typeof stamp.stampUrl === 'string' ? stamp.stampUrl : '',
          status: typeof stamp.status === 'string' ? stamp.status : '',
        };
      })
      .filter((stamp): stamp is ApiStamp => stamp !== null);
  }

  async getApiActiveStamp(type: number = SettingsData.stamps.types.standard): Promise<ApiStamp> {
    const { stamps } = await this.fetchStampsFromApi({ type });
    const active = stamps.find((stamp) => stamp.status === 'Active' || stamp.status === '1') ?? stamps[0];

    if (!active) {
      throw new Error('No stamp found from API');
    }

    return active;
  }

  mapLanguageCodeToLabel(code: string): string {
    switch (code) {
      case SettingsData.languages.thai.code:
        return SettingsData.languages.thai.label;
      case SettingsData.languages.japanese.code:
        return SettingsData.languages.japanese.label;
      default:
        return SettingsData.languages.english.label;
    }
  }

  mapLanguageCodeToDashboardTitle(code: string): string {
    switch (code) {
      case SettingsData.languages.thai.code:
        return SettingsData.languages.thai.dashboardTitle;
      case SettingsData.languages.japanese.code:
        return SettingsData.languages.japanese.dashboardTitle;
      default:
        return SettingsData.languages.english.dashboardTitle;
    }
  }

  async restoreSettingsToApi(settings: ApiSettings) {
    await this.page.request.put(`${this.apiBaseUrl}/settings`, {
      headers: await this.getAuthHeaders(),
      data: {
        supportUrl: settings.url,
        supportEmail: settings.email,
        supportPhoneNumber: settings.contact_details,
        languagePreference: settings.CHANGE_LANGUAGE,
      },
    });
  }

  // ── Support details ─────────────────────────────────────────────────────────

  async openSupportDetailsEdit() {
    await this.supportEditIcon().click();
    await expect(this.settingsModal()).toBeVisible({ timeout: 15_000 });
    await expect(this.urlInput()).toBeVisible({ timeout: 15_000 });
  }

  async fillSupportForm(data: {
    url?: string;
    email?: string;
    contact?: string;
    languageLabel?: string;
  }) {
    if (data.url !== undefined) {
      await this.urlInput().fill(data.url);
    }
    if (data.email !== undefined) {
      await this.emailInput().fill(data.email);
    }
    if (data.contact !== undefined) {
      await this.contactInput().fill(data.contact);
    }
    if (data.languageLabel) {
      await this.page
        .locator('.language-class-setting')
        .getByRole('radio', { name: data.languageLabel, exact: true })
        .check();
    }
  }

  async submitSupportForm(options?: { waitForSuccess?: boolean }) {
    await this.updateButton().click();
    if (options?.waitForSuccess !== false) {
      await expect(this.toast(SettingsData.messages.saved)).toBeVisible({ timeout: 30_000 });
      await expect(this.settingsModal()).toBeHidden({ timeout: 15_000 });
    }
  }

  async updateSupportDetails(data: Parameters<SettingsPage['fillSupportForm']>[0]) {
    await this.openSupportDetailsEdit();
    await this.fillSupportForm(data);
    await this.submitSupportForm();
  }

  async getDisplayedSupportValue(label: string): Promise<string> {
    const row = this.supportDetailsSection().locator('tr').filter({ hasText: label });
    return (await row.locator('td').last().textContent())?.trim() ?? '';
  }

  async clickSupportUrlLink() {
    const [popup] = await Promise.all([
      this.page.context().waitForEvent('page'),
      this.supportUrlLink().click(),
    ]);
    await popup.waitForLoadState('domcontentloaded');
    return popup;
  }

  // ── Stamps ──────────────────────────────────────────────────────────────────

  async selectStampTab(tab: 'standard' | 'approval') {
    const label =
      tab === 'approval' ? SettingsData.stamps.tabs.approval : SettingsData.stamps.tabs.standard;
    const type =
      tab === 'approval' ? SettingsData.stamps.types.approval : SettingsData.stamps.types.standard;
    const stampResponse = this.page
      .waitForResponse(
        (resp) => resp.url().includes('/settings/stamp') && resp.url().includes(`type=${type}`),
        { timeout: 15_000 },
      )
      .catch(() => undefined);

    await this.settingsModal().getByText(label, { exact: true }).click();
    await stampResponse;
  }

  async openSeeAllStamps(options: { tab?: 'standard' | 'approval' } = {}) {
    await this.seeAllStampsButton().click();
    await expect(this.settingsModal()).toBeVisible({ timeout: 15_000 });
    if (options.tab) {
      await this.selectStampTab(options.tab);
    }
  }

  async openUploadStamps(options: { tab?: 'standard' | 'approval' } = {}) {
    await this.uploadNewStampButton().click();
    await expect(this.settingsModal()).toBeVisible({ timeout: 15_000 });
    await expect(this.stampUploadInput()).toBeAttached({ timeout: 15_000 });
    if (options.tab) {
      await this.selectStampTab(options.tab);
    }
  }

  async uploadStampFiles(filePaths: string[]) {
    const resolved = filePaths.map((file) => path.resolve(file));
    await this.stampUploadInput().setInputFiles(resolved);
  }

  async deleteFirstStampInModal() {
    const deleteIcon = this.stampDeleteIcons().first();
    await expect(deleteIcon).toBeVisible({ timeout: 15_000 });
    await deleteIcon.click();
    await expect(this.toast(SettingsData.messages.stampDeleted)).toBeVisible({ timeout: 30_000 });
  }

  async closeModal() {
    if (await this.backButton().isVisible().catch(() => false)) {
      await this.backButton().click();
    } else if (await this.cancelModalButton().isVisible().catch(() => false)) {
      await this.cancelModalButton().click();
    } else {
      await this.page.keyboard.press('Escape').catch(() => undefined);
    }
    await expect(this.settingsModal()).toBeHidden({ timeout: 15_000 });
  }

  // ── Language / login helpers ────────────────────────────────────────────────

  async selectDefaultLanguage(languageLabel: string) {
    await this.updateSupportDetails({ languageLabel });
  }

  async expectDashboardTitle(title: string) {
    await this.page.goto('/dashboard', { waitUntil: 'commit', timeout: 120_000 });
    await expect(this.page.locator('#pageTitle')).toHaveText(title, { timeout: 60_000 });
  }

  async logoutAndLoginAgain() {
    await this.page.getByRole('button', { name: /^logout$/i }).click();
    await this.page.getByRole('button', { name: /^yes$/i }).click();
    await expect(this.page.locator('#username')).toBeVisible({ timeout: 60_000 });
    await restoreSession(this.page);
  }

  async expectCreateUserDefaultLanguage(languageLabel: string) {
    await this.page.goto('/create-mobile-user', { waitUntil: 'commit', timeout: 120_000 });
    const checked = this.page.locator('.languagePreference input[type="radio"]:checked, .languageClass input[type="radio"]:checked');
    await expect(checked).toBeVisible({ timeout: 30_000 });
    const label = await checked.locator('xpath=ancestor::label').textContent();
    expect(label?.trim()).toContain(languageLabel);
    await this.page.goto(SettingsData.path, { waitUntil: 'commit', timeout: 120_000 });
  }

  // ── Assertions ──────────────────────────────────────────────────────────────

  async expectValidationMessage(text: string | RegExp) {
    await expect(this.fieldError(text).first().or(this.uploadError().filter({ hasText: text })).first()).toBeVisible({
      timeout: 15_000,
    });
  }

  async expectButtonPointerCursor(button: Locator) {
    await expect(button).toBeVisible();
    const cursor = await button.evaluate((el) => getComputedStyle(el).cursor);
    expect(cursor).toBe('pointer');
  }

  async resetAfterTest(baseline?: ApiSettings) {
    if (await this.settingsModal().isVisible().catch(() => false)) {
      await this.closeModal().catch(() => undefined);
    }

    if (baseline) {
      await this.restoreSettingsToApi(baseline).catch(() => undefined);
      if (this.isOnSettingsPage()) {
        await this.page.reload({ waitUntil: 'commit', timeout: 120_000 });
        await this.expectSettingsLoaded().catch(() => undefined);
      }
    }
  }
}
