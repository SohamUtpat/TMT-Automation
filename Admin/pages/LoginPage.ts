import { expect, type Locator, type Page, type Response } from '@playwright/test';
import { loginData } from '../data/loginData';
import { adminPageTitle } from '../utils/adminPageTitle';

type LoginOutcome = 'logged-in' | 'dashboard' | 'error' | 'pending';

export class LoginPage {
  readonly page: Page;

  readonly username: Locator;
  readonly password: Locator;
  readonly loginBtn: Locator;
  readonly forgotPasswordLink: Locator;
  readonly helpDocumentLink: Locator;
  readonly passwordEyeIcon: Locator;
  readonly errorMessage: Locator;
  /** Authenticated chrome — dashboard lives at `/`, not `/dashboard`. */
  readonly loggedInShell: Locator;
  readonly alreadyLoggedInDialog: Locator;

  /** Last toast text captured during login(); ant toasts auto-dismiss quickly. */
  lastErrorMessage = '';
  lastLoginOutcome: LoginOutcome = 'pending';
  lastLoginStatus: number | null = null;

  /**
   * Local UMS rate-limits burst POSTs to /login (valid and invalid alike).
   * Space calls across the worker and only back off longer when a real 429 hits.
   */
  private static lastLoginApiAtMs = 0;
  private static readonly LOGIN_API_GAP_MS = 2_500;
  private static readonly RATE_LIMIT_BACKOFF_MS = 12_000;
  private static readonly MAX_RATE_LIMIT_ATTEMPTS = 5;

  constructor(page: Page) {
    this.page = page;

    this.username = page.locator('#username');
    this.password = page.locator('#password');
    this.loginBtn = page.locator('button.ant-btn-primary');
    this.forgotPasswordLink = page.getByText('here').first();
    this.helpDocumentLink = page.getByText('here').last();
    this.passwordEyeIcon = page.locator('.ant-input-password-icon, .ant-input-suffix');
    this.errorMessage = page.locator('.ant-message-notice-content');
    this.loggedInShell = page.getByRole('menuitem', { name: /Dashboard/i }).first();
    this.alreadyLoggedInDialog = page.getByText(
      /already logged in from another device/i,
    );
  }

  private async isLoggedInView(): Promise<boolean> {
    return (
      (await this.loggedInShell.isVisible().catch(() => false)) ||
      (await adminPageTitle(this.page).isVisible().catch(() => false))
    );
  }

  private isLoginApiResponse(url: string, method: string): boolean {
    return method === 'POST' && /user-management-service.*\/login/i.test(url);
  }

  private isRateLimited(status: number | null, message: string): boolean {
    return status === 429 || /too many requests/i.test(message);
  }

  private async attemptLoginOnce(
    username: string,
    password: string,
  ): Promise<LoginOutcome> {
    this.lastErrorMessage = '';
    this.lastLoginOutcome = 'pending';
    this.lastLoginStatus = null;

    let toastText = '';
    const toastCapture = this.errorMessage
      .first()
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(async () => {
        toastText = ((await this.errorMessage.first().textContent()) ?? '').trim();
      })
      .catch(() => undefined);

    const loginResponsePromise = this.waitForLoginApi();
    await this.submitLoginForm(username, password);
    const response = await loginResponsePromise;

    if (!response) {
      await Promise.race([toastCapture, this.page.waitForTimeout(5_000)]);
      this.lastErrorMessage = toastText || (await this.captureVisibleToast(2_000));
      this.lastLoginOutcome = this.lastErrorMessage ? 'error' : 'pending';
      return this.lastLoginOutcome;
    }

    this.lastLoginStatus = response.status();

    if (response.status() >= 400) {
      await Promise.race([toastCapture, this.page.waitForTimeout(5_000)]);
      this.lastErrorMessage =
        toastText ||
        (await this.captureVisibleToast(3_000)) ||
        `Login API returned HTTP ${response.status()}`;
      this.lastLoginOutcome = 'error';
      return this.lastLoginOutcome;
    }

    void toastCapture;
    this.lastLoginOutcome = await this.waitForSuccessOutcome();

    if (this.lastLoginOutcome === 'pending' && (await this.isLoggedInView())) {
      this.lastLoginOutcome = 'logged-in';
    }

    if (this.lastLoginOutcome === 'pending') {
      this.lastErrorMessage = toastText || (await this.captureVisibleToast(2_000));
      if (this.lastErrorMessage) {
        this.lastLoginOutcome = 'error';
      }
    }

    return this.lastLoginOutcome;
  }

  /**
   * Branch on the login API result instead of racing success (30–120s) against a
   * toast that ant Design auto-dismisses in a few seconds. That race was the main
   * cause of both multi-minute negative tests and flake.
   *
   * Negative cases still POST /login, so they count toward UMS rate limits.
   * Keep a short gap between calls; on HTTP 429 wait longer and retry — never
   * treat rate-limit as invalid credentials.
   */
  async login(username: string, password: string): Promise<LoginOutcome> {
    for (let attempt = 0; attempt < LoginPage.MAX_RATE_LIMIT_ATTEMPTS; attempt += 1) {
      if (attempt > 0) {
        await this.page.waitForTimeout(LoginPage.RATE_LIMIT_BACKOFF_MS);
        await this.ensureLoginScreen();
      } else {
        await this.waitForLoginApiGap();
      }

      LoginPage.lastLoginApiAtMs = Date.now();
      const outcome = await this.attemptLoginOnce(username, password);

      if (!this.isRateLimited(this.lastLoginStatus, this.lastErrorMessage)) {
        return outcome;
      }

      if (attempt === LoginPage.MAX_RATE_LIMIT_ATTEMPTS - 1) {
        return outcome;
      }
    }

    return this.lastLoginOutcome;
  }

  /** Ensure consecutive /login POSTs in this worker are spaced apart. */
  private async waitForLoginApiGap() {
    if (LoginPage.lastLoginApiAtMs <= 0) {
      return;
    }

    const elapsedMs = Date.now() - LoginPage.lastLoginApiAtMs;
    const remainingMs = LoginPage.LOGIN_API_GAP_MS - elapsedMs;
    if (remainingMs > 0) {
      await this.page.waitForTimeout(remainingMs);
    }
  }

  private waitForLoginApi(timeoutMs = 30_000): Promise<Response | undefined> {
    return this.page
      .waitForResponse(
        (resp) => this.isLoginApiResponse(resp.url(), resp.request().method()),
        { timeout: timeoutMs },
      )
      .catch(() => undefined);
  }

  async navigate() {
    // Local webpack is usually fast; keep a high ceiling for cold remote bundles.
    const bundleLoaded = this.page
      .waitForResponse((resp) => resp.url().includes('/bundle.js'), { timeout: 120_000 })
      .catch(() => undefined);

    await this.page.goto(loginData.baseUrl, {
      waitUntil: 'commit',
      timeout: 120_000,
    });

    await bundleLoaded;
    await this.username.waitFor({ state: 'visible', timeout: 60_000 });
    await this.ensureEnglishLanguage();
  }

  /**
   * Login page defaults to Japanese. Specs assert English labels/toasts/placeholders,
   * so force English via the login language picker when needed.
   */
  async ensureEnglishLanguage() {
    if (!(await this.username.isVisible().catch(() => false))) {
      return;
    }

    const placeholder = await this.username.getAttribute('placeholder');
    if (placeholder === loginData.englishUsernamePlaceholder) {
      return;
    }

    const englishButton = this.page.getByRole('button', {
      name: loginData.englishLanguageButtonLabel,
      exact: true,
    });

    if (await englishButton.isVisible().catch(() => false)) {
      await englishButton.click();
      await expect(this.username).toHaveAttribute(
        'placeholder',
        loginData.englishUsernamePlaceholder,
        { timeout: 15_000 },
      );
      return;
    }

    // Fallback when the picker is unavailable: persist English and reload once.
    await this.page
      .evaluate(
        ({ key, value }) => {
          try {
            localStorage.setItem(key, value);
          } catch {
            // Ignore storage access errors.
          }
        },
        {
          key: loginData.languageStorageKey,
          value: loginData.englishLanguageCode,
        },
      )
      .catch(() => undefined);

    await this.page.reload({ waitUntil: 'commit', timeout: 120_000 });
    await this.username.waitFor({ state: 'visible', timeout: 60_000 });
    await expect(this.username).toHaveAttribute(
      'placeholder',
      loginData.englishUsernamePlaceholder,
      { timeout: 15_000 },
    );
  }

  private async clearLoginForm() {
    await this.username.fill('', { force: true });
    await this.password.fill('', { force: true });
  }

  private async dismissErrorMessages() {
    await this.page.evaluate(() => {
      document.querySelectorAll('.ant-message-notice').forEach((node) => node.remove());
    });
  }

  async isOnCleanLoginScreen(): Promise<boolean> {
    if (!(await this.username.isVisible().catch(() => false))) {
      return false;
    }

    if (await this.isLoggedInView()) {
      return false;
    }

    if ((await this.username.inputValue()) !== '') {
      return false;
    }

    if ((await this.password.inputValue()) !== '') {
      return false;
    }

    return true;
  }

  async prepareLoginScreenForTest() {
    if (await this.isOnCleanLoginScreen()) {
      await this.dismissErrorMessages();
      await this.ensureEnglishLanguage();
      return;
    }

    await this.ensureLoginScreen();
  }

  private async clearBrowserStorage() {
    await this.page
      .evaluate(
        ({ key, value }) => {
          try {
            localStorage.clear();
            sessionStorage.clear();
            // Keep English after wipe so the next login load is not Japanese.
            localStorage.setItem(key, value);
          } catch {
            // Ignore on about:blank or other documents that block storage access.
          }
        },
        {
          key: loginData.languageStorageKey,
          value: loginData.englishLanguageCode,
        },
      )
      .catch(() => undefined);
  }

  async ensureLoginScreen() {
    if (await this.isOnCleanLoginScreen()) {
      await this.dismissErrorMessages();
      await this.ensureEnglishLanguage();
      return;
    }

    const usernameVisible = await this.username.isVisible().catch(() => false);
    const loggedIn = await this.isLoggedInView();

    if (loggedIn) {
      await this.clearBrowserStorage();
      await this.navigate();
      return;
    }

    if (!usernameVisible) {
      await this.navigate();
      return;
    }

    await this.clearLoginForm();
    await this.dismissErrorMessages();
    await this.ensureEnglishLanguage();
  }

  async resetAfterTest() {
    const loggedIn = await this.isLoggedInView();

    if (loggedIn) {
      await this.clearBrowserStorage();
      await this.navigate();
      return;
    }

    await this.dismissErrorMessages();
    await this.clearLoginForm();
  }

  async submitLoginForm(username: string, password: string) {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.loginBtn.click();
  }

  private async captureVisibleToast(timeoutMs = 8_000): Promise<string> {
    const toast = this.errorMessage.first();
    const visible = await toast
      .waitFor({ state: 'visible', timeout: timeoutMs })
      .then(() => true)
      .catch(() => false);

    if (!visible) {
      return '';
    }

    return ((await toast.textContent()) ?? '').trim();
  }

  private async waitForSuccessOutcome(): Promise<LoginOutcome> {
    const shellVisible = this.loggedInShell
      .waitFor({ state: 'visible', timeout: 30_000 })
      .then(() => 'logged-in' as const);

    const titleVisible = adminPageTitle(this.page)
      .waitFor({ state: 'visible', timeout: 30_000 })
      .then(() => 'logged-in' as const);

    const dashboardUrl = this.page
      .waitForURL(/\/dashboard(?:\/|$|\?)/, { timeout: 30_000 })
      .then(() => 'dashboard' as const);

    const forceLogin = this.alreadyLoggedInDialog
      .waitFor({ state: 'visible', timeout: 30_000 })
      .then(async () => {
        await this.page.getByRole('button', { name: /^OK$/i }).last().click();
        await this.loggedInShell.waitFor({ state: 'visible', timeout: 30_000 });
        return 'logged-in' as const;
      });

    return Promise.race([shellVisible, titleVisible, dashboardUrl, forceLogin]).catch(
      () => 'pending' as const,
    );
  }

  async loginAsAdmin() {
    await this.navigate();
    const outcome = await this.login(loginData.validUser, loginData.validPassword);

    if (outcome === 'error') {
      throw new Error(
        `Admin login failed for "${loginData.validUser}". ` +
          `status=${this.lastLoginStatus ?? 'n/a'} toast="${this.lastErrorMessage || '(none)'}". ` +
          `Check VALID_USERNAME / VALID_PASSWORD and that user-management (:8082) is up.`,
      );
    }

    if (outcome !== 'logged-in' && outcome !== 'dashboard') {
      throw new Error(`Admin login failed with outcome: ${outcome}`);
    }

    await this.loggedInShell.waitFor({ state: 'visible', timeout: 60_000 });
  }

  async expectLoggedIn() {
    if (this.isRateLimited(this.lastLoginStatus, this.lastErrorMessage)) {
      throw new Error(
        `Expected successful login but UMS rate-limited the request (HTTP 429). ` +
          `toast="${this.lastErrorMessage || '(empty)'}". ` +
          `Wait for the rate-limit window to clear, or slow the login suite further.`,
      );
    }

    if (this.lastLoginOutcome === 'error') {
      throw new Error(
        `Expected successful login but got error. ` +
          `status=${this.lastLoginStatus ?? 'n/a'} toast="${this.lastErrorMessage || '(empty)'}".`,
      );
    }

    const onShell = await this.isLoggedInView();
    if (this.lastLoginOutcome === 'pending' && !onShell) {
      throw new Error(
        `Expected successful login but outcome stayed pending. URL=${this.page.url()}`,
      );
    }

    await expect(this.loggedInShell).toBeVisible({ timeout: 15_000 });
    await expect(this.page.getByText(loginData.validUser, { exact: true }).first()).toBeVisible({
      timeout: 10_000,
    });
  }

  async expectInvalidCredentials() {
    if (this.lastLoginOutcome === 'logged-in' || this.lastLoginOutcome === 'dashboard') {
      throw new Error(
        `Expected invalid credentials but login succeeded (outcome=${this.lastLoginOutcome}). ` +
          `Username may be case-insensitive or credentials unexpectedly valid.`,
      );
    }

    const message = this.lastErrorMessage || (await this.captureVisibleToast(5_000));

    // FE may show a credentials-style toast on 429 — never treat that as a pass.
    if (this.isRateLimited(this.lastLoginStatus, message)) {
      throw new Error(
        `Expected invalid-credentials response but got UMS rate limit (HTTP 429). ` +
          `toast="${message || '(none)'}".`,
      );
    }

    const matched = loginData.invalidCredentialsMessages.some((expected) =>
      message.toLowerCase().includes(expected.toLowerCase()),
    );

    expect(
      matched,
      `Expected invalid-credentials toast, got "${message || '(none)'}". ` +
        `status=${this.lastLoginStatus ?? 'n/a'} outcome=${this.lastLoginOutcome}`,
    ).toBe(true);
  }

  async expectEmptyFieldValidationErrors() {
    await expect(this.page.getByText(loginData.usernameRequiredMessage)).toBeVisible();
    await expect(this.page.getByText(loginData.passwordRequiredMessage)).toBeVisible();
  }
}
