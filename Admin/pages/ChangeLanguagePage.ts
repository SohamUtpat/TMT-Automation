import { expect, type Locator, type Page } from '@playwright/test';
import { ChangeLanguageData } from '../data/ChangeLanguageData';
import { ensureAuthenticated as restoreSession } from '../utils/ensureAuthenticated';

type LanguageKey = keyof typeof ChangeLanguageData.languages;

export class ChangeLanguagePage {
  readonly page: Page;
  private localeChanged = false;

  constructor(page: Page) {
    this.page = page;
  }

  profileDropdown = () => this.page.locator('.dropdown-trigger');

  changeLanguageMenuItem = () => this.page.locator('a[href="/profile/change-language"]');

  languageRadio = (label: string) => this.page.getByRole('radio', { name: label, exact: true });

  confirmLanguageButton = () => this.page.locator('.change-lang-form-div button.ant-btn-primary');

  backButton = () => this.page.locator('.header-title-back.button-css');

  confirmModal = () => this.page.locator('.common-modal-box');

  toast = (text: string | RegExp) => this.page.locator('.ant-message-notice-content').filter({ hasText: text });

  /** Re-login when storageState token was rejected and the app redirected to login. */
  async ensureAuthenticated() {
    await restoreSession(this.page);
  }

  async ensureDashboardReady() {
    if (!/\/dashboard(?:\/|$|\?)/.test(this.page.url())) {
      await this.page.goto('/dashboard', { waitUntil: 'commit', timeout: 120_000 });
    }

    await this.ensureAuthenticated();

    if (!/\/dashboard(?:\/|$|\?)/.test(this.page.url())) {
      await this.page.goto('/dashboard', { waitUntil: 'commit', timeout: 120_000 });
    }

    await expect(this.page.locator('#pageTitle')).toBeVisible({ timeout: 60_000 });
  }

  async openFromProfileMenu() {
    await this.ensureAuthenticated();
    await this.profileDropdown().click();
    await this.changeLanguageMenuItem().click();
    await this.expectChangeLanguagePageLoaded();
  }

  async navigateToChangeLanguage() {
    if (this.isOnChangeLanguagePage() && (await this.isChangeLanguageContentReady())) {
      return;
    }

    if (!this.isOnChangeLanguagePage()) {
      await this.page.goto(ChangeLanguageData.path, { waitUntil: 'commit', timeout: 60_000 });
    }

    await this.ensureAuthenticated();

    if (!this.isOnChangeLanguagePage()) {
      await this.page.goto(ChangeLanguageData.path, { waitUntil: 'commit', timeout: 60_000 });
    }

    await this.waitForChangeLanguageContent();
  }

  isOnChangeLanguagePage(): boolean {
    return new URL(this.page.url()).pathname.replace(/\/$/, '') === ChangeLanguageData.path;
  }

  private async isChangeLanguageContentReady(): Promise<boolean> {
    const [titleVisible, confirmVisible, radioVisible] = await Promise.all([
      this.page.locator('#pageTitle').isVisible().catch(() => false),
      this.confirmLanguageButton().isVisible().catch(() => false),
      this.languageRadio(ChangeLanguageData.languages.english.label).isVisible().catch(() => false),
    ]);

    return titleVisible && confirmVisible && radioVisible;
  }

  private async waitForChangeLanguageContent() {
    await expect(this.page).toHaveURL(new RegExp(`${ChangeLanguageData.path}$`), { timeout: 30_000 });

    const loading = this.page.getByText('Loading...', { exact: true });
    if (await loading.isVisible().catch(() => false)) {
      await loading.waitFor({ state: 'hidden', timeout: 45_000 }).catch(async () => {
        await this.page.reload({ waitUntil: 'commit', timeout: 60_000 });
        await loading.waitFor({ state: 'hidden', timeout: 45_000 }).catch(() => undefined);
      });
    }

    await expect(this.page.locator('#pageTitle')).toBeVisible({ timeout: 30_000 });
    await expect(this.languageRadio(ChangeLanguageData.languages.english.label)).toBeVisible({
      timeout: 30_000,
    });
    await expect(this.confirmLanguageButton()).toBeVisible({ timeout: 15_000 });
  }

  async expectChangeLanguagePageLoaded() {
    await this.waitForChangeLanguageContent();
  }

  /** Lighter check for TC_AP_64 — validates menu access without waiting for full form hydration each time. */
  async expectAccessibleFromPage(path: string, pageTitle: string) {
    await this.page.goto(path, { waitUntil: 'commit', timeout: 60_000 });
    await expect(this.page.locator('#pageTitle')).toHaveText(pageTitle, { timeout: 30_000 });
    await this.profileDropdown().click();
    await expect(this.changeLanguageMenuItem()).toBeVisible({ timeout: 10_000 });
    await this.changeLanguageMenuItem().click();
    await expect(this.page).toHaveURL(new RegExp(`${ChangeLanguageData.path}$`), { timeout: 30_000 });
    await expect(this.page.locator('#pageTitle')).toBeVisible({ timeout: 15_000 });
  }

  async selectLanguage(label: string) {
    await this.languageRadio(label).check();
    await expect(this.languageRadio(label)).toBeChecked();
  }

  async clickConfirmLanguage() {
    await this.confirmLanguageButton().click();
  }

  async confirmModalAction(confirm = true) {
    const modal = this.confirmModal();
    await expect(modal).toBeVisible({ timeout: 10_000 });
    const buttons = modal.locator('.top-height-css button, .modal-content-css button');
    await buttons.nth(confirm ? 0 : 1).click();
    if (confirm) {
      await expect(modal).toBeHidden({ timeout: 15_000 });
    }
  }

  async submitLanguageChange(label: string, options: { confirmModal?: boolean; waitForToast?: boolean } = {}) {
    const confirmModal = options.confirmModal ?? true;
    const waitForToast = options.waitForToast ?? false;

    await this.selectLanguage(label);
    await this.clickConfirmLanguage();

    if (!confirmModal) {
      return;
    }

    await this.confirmModalAction(true);

    if (waitForToast) {
      await expect(this.toast(ChangeLanguageData.messages.languageUpdated)).toBeVisible({
        timeout: 15_000,
      });
    }

    if (label !== ChangeLanguageData.languages.english.label) {
      this.localeChanged = true;
    } else {
      this.localeChanged = false;
    }
  }

  async expectLanguageSelected(label: string) {
    await expect(this.languageRadio(label)).toBeChecked();
  }

  async expectChangeLanguagePageTitleForLanguage(key: LanguageKey) {
    await expect(this.page.locator('#pageTitle')).toHaveText(this.languageByKey(key).changeLanguagePageTitle);
  }

  async changeLanguageAndVerify(key: LanguageKey) {
    const language = this.languageByKey(key);
    await this.navigateToChangeLanguage();
    await this.selectLanguage(language.label);
    await this.clickConfirmLanguage();
    await this.confirmModalAction(true);
    await this.expectChangeLanguagePageTitleForLanguage(key);
    this.localeChanged = key !== 'english';
  }

  async expectDashboardTitle(title: string) {
    if (!new URL(this.page.url()).pathname.includes('/dashboard')) {
      await this.page.goto('/dashboard', { waitUntil: 'commit', timeout: 60_000 });
    }
    await expect(this.page.locator('#pageTitle')).toHaveText(title, { timeout: 30_000 });
  }

  async expectButtonPointerCursor(button: Locator) {
    await expect(button).toBeVisible();
    const cursor = await button.evaluate((el) => getComputedStyle(el).cursor);
    expect(cursor).toBe('pointer');
  }

  languageByKey(key: LanguageKey) {
    return ChangeLanguageData.languages[key];
  }

  private async readPageTitle(): Promise<string> {
    return (await this.page.locator('#pageTitle').textContent())?.trim() ?? '';
  }

  private async isEnglishLocale(): Promise<boolean> {
    const title = await this.readPageTitle();
    const { english, thai, japanese } = ChangeLanguageData.languages;

    if (title === thai.dashboardTitle || title === thai.changeLanguagePageTitle) {
      return false;
    }

    if (title === japanese.dashboardTitle || title === japanese.changeLanguagePageTitle) {
      return false;
    }

    return title === english.dashboardTitle || title === english.changeLanguagePageTitle || title === '';
  }

  async resetLanguageToEnglish() {
    if (!this.localeChanged && (await this.isEnglishLocale())) {
      return;
    }

    await this.navigateToChangeLanguage();
    const english = ChangeLanguageData.languages.english;
    const englishChecked = await this.languageRadio(english.label).isChecked().catch(() => false);

    if (!englishChecked) {
      await this.selectLanguage(english.label);
      await this.clickConfirmLanguage();
      await this.confirmModalAction(true);
      await this.expectChangeLanguagePageTitleForLanguage('english');
    }

    this.localeChanged = false;
  }

  async resetAfterTest() {
    await this.resetLanguageToEnglish().catch(() => undefined);

    if (this.isOnChangeLanguagePage()) {
      await this.page.goto('/dashboard', { waitUntil: 'commit', timeout: 60_000 }).catch(() => undefined);
    }
  }
}
