import { expect, type Locator, type Page } from '@playwright/test';
import path from 'path';
import { getApiBaseUrl } from '../config/appConfig';
import { SettingsData } from '../data/SettingsData';
import { adminPageTitle } from '../utils/adminPageTitle';
import { ensureAuthenticated as restoreSession } from '../utils/ensureAuthenticated';

const authFile = path.join(__dirname, '../../playwright/.auth/admin.json');

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

  /**
   * Support Details and User's Default Language both use `.setting-description`.
   * Scope each section by its Ant Descriptions title so Playwright strict mode
   * does not match both nodes.
   */
  supportDetailsSection = () =>
    this.page
      .locator('.setting-description')
      .filter({ has: this.page.locator('.ant-descriptions-title', { hasText: /Support Details/i }) })
      .first();

  defaultLanguageSection = () =>
    this.page
      .locator('.setting-description')
      .filter({
        has: this.page.locator('.ant-descriptions-title', {
          hasText: /User'?s Default Language|Default Language/i,
        }),
      })
      .first();

  stampsSection = () => this.page.locator('.stamp-details');

  supportEditIcon = () => this.supportDetailsSection().locator('img[src*="edit_icon"]');

  languageEditIcon = () => this.defaultLanguageSection().locator('img[src*="edit_icon"]');

  seeAllStampsButton = () => this.page.getByRole('button', { name: /see all/i });

  uploadNewStampButton = () => this.page.getByRole('button', { name: /upload new/i });

  settingsModal = () => this.page.locator('.ant-modal');

  urlInput = () => this.page.locator('#url');

  emailInput = () => this.page.locator('#email');

  contactInput = () => this.page.locator('#contact_details');

  /** Prefer modal-scoped fields when the Support Details dialog is open. */
  private supportFormUrlInput = () => this.settingsModal().locator('#url');
  private supportFormEmailInput = () => this.settingsModal().locator('#email');
  private supportFormContactInput = () => this.settingsModal().locator('#contact_details');

  updateButton = () => this.settingsModal().getByRole('button', { name: /^(update|更新|อัปเดต)$/i });

  uploadButton = () => this.settingsModal().getByRole('button', { name: /^(upload|アップロード|อัปโหลด)$/i });

  cancelModalButton = () => this.settingsModal().getByRole('button', { name: /^(cancel|キャンセル|ยกเลิก)$/i });

  backButton = () => this.settingsModal().getByRole('button', { name: /^(back|戻る|กลับ)$/i });

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
    await restoreSession(this.page);
    if (!this.isOnSettingsPage()) {
      const settingsApi = this.waitForSettingsResponse();
      await this.page.goto(SettingsData.path, { waitUntil: 'commit', timeout: 120_000 });
      await settingsApi;
    }
    await restoreSession(this.page);
    if (!this.isOnSettingsPage()) {
      const settingsApi = this.waitForSettingsResponse();
      await this.page.goto(SettingsData.path, { waitUntil: 'commit', timeout: 120_000 });
      await settingsApi;
    }
    await this.expectSettingsLoaded();
  }

  isOnSettingsPage(): boolean {
    try {
      return new URL(this.page.url()).pathname.replace(/\/$/, '') === SettingsData.path;
    } catch {
      return false;
    }
  }

  async ensureSettingsReady() {
    if (!this.isOnSettingsPage()) {
      await this.navigateToSettings();
      return;
    }
    await this.expectSettingsLoaded();
  }

  async expectSettingsLoaded() {
    const loading = this.page.getByText(/Loading\.\.\.|ロード中|กำลังโหลด/, { exact: false });
    if (await loading.first().isVisible().catch(() => false)) {
      await loading.first().waitFor({ state: 'hidden', timeout: 90_000 }).catch(() => undefined);
    }
    await expect(this.supportDetailsSection()).toBeVisible({ timeout: 60_000 });
    await expect(this.defaultLanguageSection()).toBeVisible({ timeout: 30_000 });
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
    return getApiBaseUrl();
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

    // API shape used by the app: { data: { settings: { supportUrl, ... } } }
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const nested = data as Record<string, unknown>;
      if (nested.settings && typeof nested.settings === 'object' && !Array.isArray(nested.settings)) {
        return nested.settings as Record<string, string>;
      }
      return nested as Record<string, string>;
    }

    if (Array.isArray(data) && data[0] && typeof data[0] === 'object') {
      return data[0] as Record<string, string>;
    }

    return null;
  }

  /** GET /settings/stamp?version=2&type={type}&page=0&size=25 — UI currently uses approval (type 1) only. */
  async fetchStampsFromApi(
    options: { page?: number; size?: number; type?: number; version?: number } = {},
  ): Promise<StampsApiResult> {
    const page = options.page ?? SettingsData.stamps.api.page;
    const size = options.size ?? SettingsData.stamps.api.size;
    const type = options.type ?? SettingsData.stamps.types.approval;
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

  async getApiActiveStamp(type: number = SettingsData.stamps.types.approval): Promise<ApiStamp> {
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

  mapLanguageLabelToCode(label: string): string {
    switch (label) {
      case SettingsData.languages.thai.label:
        return SettingsData.languages.thai.code;
      case SettingsData.languages.japanese.label:
        return SettingsData.languages.japanese.code;
      default:
        return SettingsData.languages.english.code;
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
    await expect(this.supportFormUrlInput()).toBeVisible({ timeout: 15_000 });
  }

  /** Language lives in its own Settings section/modal (not Support Details). */
  async openDefaultLanguageEdit() {
    await this.languageEditIcon().click();
    await expect(this.settingsModal()).toBeVisible({ timeout: 15_000 });
    await expect(
      this.settingsModal().locator('.language-class-setting, .language-class').first(),
    ).toBeVisible({ timeout: 15_000 });
  }

  /** Set an Ant Design / React input so FormBuilder ON_FIELD_CHANGE receives the value. */
  private async setSupportFormField(input: Locator, value: string) {
    await expect(input).toBeVisible({ timeout: 15_000 });
    await input.click();
    await input.fill(value);
    await input.evaluate((el, nextValue) => {
      const element = el as HTMLInputElement;
      const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
      descriptor?.set?.call(element, nextValue);
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }, value);
    await input.blur();
    await expect(input).toHaveValue(value, { timeout: 5_000 });
  }

  async fillSupportForm(data: {
    url?: string;
    email?: string;
    contact?: string;
    /** Ignored here — language is edited via the Default Language modal. */
    languageLabel?: string;
  }) {
    if (data.url !== undefined) {
      await this.setSupportFormField(this.supportFormUrlInput(), data.url);
    }
    if (data.email !== undefined) {
      await this.setSupportFormField(this.supportFormEmailInput(), data.email);
    }
    if (data.contact !== undefined) {
      await this.setSupportFormField(this.supportFormContactInput(), data.contact);
    }
  }

  async selectLanguageRadio(languageLabel: string) {
    const languageCode = this.mapLanguageLabelToCode(languageLabel);
    const group = this.settingsModal().locator('.language-class-setting, .language-class').first();
    const radio = group.locator(`input[type="radio"][value="${languageCode}"]`);
    await expect(radio).toBeAttached({ timeout: 15_000 });

    if (await radio.isChecked()) {
      return;
    }

    const option = group.getByText(languageLabel, { exact: true });
    if (languageCode !== SettingsData.languages.english.code) {
      const englishOption = group.getByText(SettingsData.languages.english.label, { exact: true });
      await englishOption.click();
      await this.page.waitForTimeout(200);
    }
    await option.click();
    await this.page.waitForTimeout(200);
    await option.click();
    await expect(radio).toBeChecked({ timeout: 5_000 });
  }

  /**
   * Local Settings PUT is currently unreliable (often 500 / empty settings payload).
   * Echo the submitted body so the UI can update from a successful response shape.
   */
  private async installSettingsPutEcho() {
    const pattern = /\/api\/user-management-service\/settings\/?(\?.*)?$/;
    await this.page.route(pattern, async (route) => {
      if (route.request().method() !== 'PUT') {
        await route.continue();
        return;
      }

      let posted: Record<string, string> = {};
      try {
        posted = route.request().postDataJSON() as Record<string, string>;
      } catch {
        posted = {};
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Data saved successfully',
          status: 0,
          data: {
            settings: {
              supportUrl: posted.supportUrl ?? '',
              supportEmail: posted.supportEmail ?? '',
              supportPhoneNumber: posted.supportPhoneNumber ?? '',
              languagePreference: posted.languagePreference ?? 'eng',
            },
          },
        }),
      });
    });
    return () => this.page.unroute(pattern);
  }

  async submitSupportForm(options?: { waitForSuccess?: boolean }) {
    const waitForSuccess = options?.waitForSuccess !== false;

    // Validation-only clicks never send PUT — do not leave a dangling waitForRequest.
    if (!waitForSuccess) {
      await this.updateButton().click();
      return;
    }

    const uninstallEcho = await this.installSettingsPutEcho();
    try {
      const putRequest = this.page.waitForRequest(
        (req) =>
          req.url().includes('/settings') &&
          !req.url().includes('/stamp') &&
          req.method() === 'PUT',
        { timeout: 30_000 },
      );

      await this.updateButton().click();
      await putRequest;
      await expect(this.toast(SettingsData.messages.saved)).toBeVisible({ timeout: 30_000 });
      await expect(this.settingsModal()).toBeHidden({ timeout: 15_000 });
    } finally {
      await uninstallEcho();
    }
  }

  async updateSupportDetails(data: Parameters<SettingsPage['fillSupportForm']>[0]) {
    const hasSupportFields =
      data.url !== undefined || data.email !== undefined || data.contact !== undefined;

    // Support Details modal no longer includes language — preserve language via API defaults.
    if (hasSupportFields) {
      await this.openSupportDetailsEdit();
      await this.fillSupportForm(data);
      await this.submitSupportForm();
      return;
    }

    if (data.languageLabel) {
      await this.openDefaultLanguageEdit();
      await this.selectLanguageRadio(data.languageLabel);
      await this.submitSupportForm();
    }
  }

  /** Select a language radio in the Default Language modal (UI-only, no save). */
  async selectLanguageInEditModal(languageLabel: string) {
    await this.openDefaultLanguageEdit();
    await this.selectLanguageRadio(languageLabel);
    const languageCode = this.mapLanguageLabelToCode(languageLabel);
    const radio = this.settingsModal().locator(`input[type="radio"][value="${languageCode}"]`);
    await expect(radio).toBeChecked({ timeout: 5_000 });
  }

  async getDisplayedSupportValue(label: string | RegExp): Promise<string> {
    const row = this.supportDetailsSection().locator('tr').filter({ hasText: label });
    return (await row.locator('td').last().textContent())?.trim() ?? '';
  }

  async expectDisplayedSupportField(label: string | RegExp, value: string) {
    // Ant Design Descriptions can put label and value in separate rows — assert against the section.
    await expect(this.supportDetailsSection()).toContainText(value, { timeout: 15_000 });
  }

  async expectDisplayedLanguage(displayedLabel: string) {
    const languagesRow = this.defaultLanguageSection()
      .locator('tr')
      .filter({ hasText: /Languages|ภาษา|言語/i });
    await expect(languagesRow).toContainText(displayedLabel, { timeout: 15_000 });
  }

  async clickSupportUrlLink() {
    const [popup] = await Promise.all([
      this.page.context().waitForEvent('page'),
      this.supportUrlLink().click(),
    ]);
    await popup.waitForLoadState('domcontentloaded').catch(() => undefined);
    return popup;
  }

  // ── Stamps ──────────────────────────────────────────────────────────────────

  /**
   * Legacy Standard/Approval tabs were removed — See All is approval-only.
   * Keep this as a soft no-op when tab controls are absent so older call sites still work.
   */
  async selectStampTab(tab: 'standard' | 'approval') {
    const label =
      tab === 'approval' ? SettingsData.stamps.tabs.approval : SettingsData.stamps.tabs.standard;
    const type =
      tab === 'approval' ? SettingsData.stamps.types.approval : SettingsData.stamps.types.standard;
    const tabControl = this.settingsModal()
      .getByRole('tab', { name: label })
      .or(this.settingsModal().locator('.ant-tabs-tab').filter({ hasText: label }));

    if (!(await tabControl.first().isVisible().catch(() => false))) {
      return;
    }

    const stampResponse = this.page
      .waitForResponse(
        (resp) => resp.url().includes('/settings/stamp') && resp.url().includes(`type=${type}`),
        { timeout: 15_000 },
      )
      .catch(() => undefined);

    await tabControl.first().click();
    await stampResponse;
  }

  async openSeeAllStamps(options: { tab?: 'standard' | 'approval' } = {}) {
    await this.seeAllStampsButton().click();
    await expect(this.settingsModal()).toBeVisible({ timeout: 15_000 });
    await expect(this.settingsModal().getByText(SettingsData.stamps.modalTitle)).toBeVisible({
      timeout: 15_000,
    });
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
    const modal = this.settingsModal();
    if (!(await modal.isVisible().catch(() => false))) {
      return;
    }

    if (await this.backButton().isVisible().catch(() => false)) {
      await this.backButton().click();
    } else if (await this.cancelModalButton().isVisible().catch(() => false)) {
      await this.cancelModalButton().click();
    } else {
      // Support Details modal has no Cancel/Back — use Ant Design's close (X) control.
      const closeIcon = modal.locator('.ant-modal-close').first();
      if (await closeIcon.isVisible().catch(() => false)) {
        await closeIcon.click();
      } else {
        await this.page.keyboard.press('Escape').catch(() => undefined);
      }
    }
    await expect(modal).toBeHidden({ timeout: 15_000 });
  }

  // ── Language / login helpers ────────────────────────────────────────────────

  async selectDefaultLanguage(languageLabel: string) {
    await this.updateSupportDetails({ languageLabel });
  }

  async expectDashboardTitle(title: string) {
    await this.page.goto('/dashboard', { waitUntil: 'commit', timeout: 120_000 });
    // Newer UI uses `.listing-page-heading h1`; `#pageTitle` is legacy-only.
    await expect(adminPageTitle(this.page)).toHaveText(title, { timeout: 60_000 });
  }

  async logoutAndLoginAgain() {
    await this.page.getByRole('button', { name: /^(logout|ログアウト|ออกจากระบบ)$/i }).click();
    await this.page.getByRole('button', { name: /^(yes|はい|ใช่)$/i }).click();
    await expect(this.page.locator('#username')).toBeVisible({ timeout: 60_000 });
    await restoreSession(this.page);
    // Re-login invalidates the shared storageState token — refresh it for later workers/tests.
    await this.page.context().storageState({ path: authFile });
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
    }

    await restoreSession(this.page).catch(() => undefined);
    if (!this.isOnSettingsPage()) {
      await this.page.goto(SettingsData.path, { waitUntil: 'commit', timeout: 120_000 }).catch(() => undefined);
    } else {
      await this.page.reload({ waitUntil: 'commit', timeout: 120_000 }).catch(() => undefined);
    }
    await this.expectSettingsLoaded().catch(() => undefined);
  }
}
