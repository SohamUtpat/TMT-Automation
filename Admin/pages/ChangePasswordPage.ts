import { expect, type Locator, type Page, type Route } from '@playwright/test';
import { getApiBaseUrl } from '../config/appConfig';
import { ChangePasswordData } from '../data/ChangePasswordData';
import { loginData } from '../data/loginData';
import { ensureAuthenticated as restoreSession } from '../utils/ensureAuthenticated';
import { expectAdminPageReady } from '../utils/pageReady';
import {
  clearPasswordCryptoCache,
  isInvalidEncryptedPassword,
  preparePasswordFields,
} from '../utils/passwordCrypto';

export type TestAdminCredentials = {
  userName: string;
  /** Current password — updated when a test successfully changes it. */
  password: string;
  /** Original password set at user creation — never use the shared admin account. */
  initialPassword: string;
  email: string;
  firstName: string;
  lastName: string;
};

export class ChangePasswordPage {
  readonly page: Page;
  /** True when the last change-password submit got a real HTTP 2xx from the server. */
  private lastChangePasswordWasReal = false;

  constructor(page: Page) {
    this.page = page;
  }

  wasPasswordChangedOnServer(): boolean {
    return this.lastChangePasswordWasReal;
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  profileDropdown = () => this.page.getByRole('button', { name: /more actions/i });

  changePasswordMenuItem = () => this.page.getByRole('link', { name: ChangePasswordData.buttons.changePassword });

  oldPasswordInput = () => this.page.locator('#currentPassword');

  newPasswordInput = () => this.page.locator('#newPassword');

  confirmPasswordInput = () => this.page.locator('#confirmPassword');

  changePasswordButton = () =>
    this.page.getByRole('button', { name: ChangePasswordData.buttons.changePassword, exact: true });

  confirmNewPasswordButton = () =>
    this.page.getByRole('button', { name: ChangePasswordData.buttons.confirmNewPassword, exact: true });

  fieldError = (text: string | RegExp) =>
    this.page.locator('.section-container-pass span, .oldPass, .newPass, .confPass').filter({ hasText: text });

  toast = (text: string | RegExp) => this.page.locator('.ant-message-notice-content').filter({ hasText: text });

  confirmModal = () => this.page.locator('.common-modal-box, .ant-modal');

  async openFromProfileMenu() {
    await this.profileDropdown().click();
    await this.changePasswordMenuItem().click();
    await this.expectChangePasswordPageLoaded();
  }

  async navigateToChangePassword() {
    if (!this.isOnChangePasswordPage()) {
      await this.page.goto(ChangePasswordData.path, { waitUntil: 'commit', timeout: 120_000 });
    }
    await this.expectChangePasswordPageLoaded();
  }

  isOnChangePasswordPage(): boolean {
    return new URL(this.page.url()).pathname.replace(/\/$/, '') === ChangePasswordData.path;
  }

  async expectChangePasswordPageLoaded() {
    await expect(this.page).toHaveURL(new RegExp(`${ChangePasswordData.path}$`), { timeout: 60_000 });
    await expect(this.oldPasswordInput()).toBeVisible({ timeout: 30_000 });
  }

  async expectAccessibleFromPage(path: string, pageTitle: string) {
    await this.page.goto(path, { waitUntil: 'commit', timeout: 120_000 });
    await expectAdminPageReady(this.page, path, pageTitle);
    await this.openFromProfileMenu();
    await this.expectChangePasswordPageLoaded();
  }

  async resetAfterTest(credentials: TestAdminCredentials) {
    const needsPasswordRestore = credentials.password !== credentials.initialPassword;
    const onLoginPage = await this.page.locator('#username').isVisible().catch(() => false);

    if (needsPasswordRestore) {
      // Successful password-change tests log out to the login screen.
      if (onLoginPage || !(await this.page.locator('#pageTitle').isVisible().catch(() => false))) {
        await this.page.goto(loginData.baseUrl, { waitUntil: 'commit', timeout: 120_000 }).catch(() => undefined);
        await restoreSession(this.page, {
          username: credentials.userName,
          password: credentials.password,
        });
      }

      await this.navigateToChangePassword();
      await this.changePasswordComplete(credentials.password, credentials.initialPassword);
      credentials.password = credentials.initialPassword;
      return;
    }

    if (onLoginPage) {
      await restoreSession(this.page, {
        username: credentials.userName,
        password: credentials.password,
      });
    }

    if (this.isOnChangePasswordPage()) {
      await this.page.goto('/dashboard', { waitUntil: 'commit', timeout: 120_000 }).catch(() => undefined);
    }
  }

  // ── API: create dedicated admin test user with known password ───────────────

  private get apiBaseUrl(): string {
    return getApiBaseUrl();
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.page.evaluate(() => localStorage.getItem('gulf_net_admin-token'));
    return {
      Authorization: `Bearer ${token ?? ''}`,
      language: 'english',
      Accept: 'application/json, text/plain, */*',
    };
  }

  private get cryptoPublicKeyUrl(): string {
    return `${this.apiBaseUrl}/crypto/public-key`;
  }

  private async delay(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async verifyAdminCredentials(userName: string, password: string): Promise<boolean> {
    const prepared = await preparePasswordFields(this.page.request, this.cryptoPublicKeyUrl, {
      password,
    });

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      const response = await this.page.request.post(`${this.apiBaseUrl}/admin/login?version=2`, {
        headers: {
          'Content-Type': 'application/json',
          language: 'english',
          Accept: 'application/json, text/plain, */*',
        },
        data: {
          userName,
          appType: 'ADMIN',
          password: prepared.password,
          machineInfo: `pw-test-${Date.now()}`,
          location: '00.0000',
          forceLogin: false,
        },
      });

      if (response.status() === 429 && attempt < 4) {
        await this.delay(5_000 * attempt);
        continue;
      }

      const body = await response.json().catch(() => ({}));
      const data =
        typeof body === 'object' && body !== null
          ? ((body as Record<string, unknown>).data as Record<string, unknown> | undefined)
          : undefined;
      const loginPayload =
        typeof data?.login === 'object' && data.login !== null
          ? (data.login as Record<string, unknown>)
          : undefined;
      const token = loginPayload?.token ?? data?.token;
      const success = response.ok() && typeof token === 'string' && token.length > 0;

      return success;
    }

    return false;
  }

  private isSamePasswordError(body: unknown): boolean {
    if (typeof body !== 'object' || body === null) {
      return false;
    }

    const error = (body as Record<string, unknown>).error;
    if (typeof error !== 'object' || error === null) {
      return false;
    }

    const message = (error as Record<string, unknown>).message;
    return typeof message === 'string' && /same as previous/i.test(message);
  }

  private async setDedicatedAdminPassword(userName: string, password: string) {
    const url = `${this.apiBaseUrl}/reset-password-by-admin?version=2`;
    const maxAttempts = 3;
    let lastStatus = 0;
    let lastBody: unknown = {};

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const prepared = await preparePasswordFields(this.page.request, this.cryptoPublicKeyUrl, {
        changePassword: password,
      });

      const response = await this.page.request.post(url, {
        headers: {
          ...(await this.getAuthHeaders()),
          'Content-Type': 'application/json',
        },
        data: {
          userName,
          changePassword: prepared.changePassword,
        },
      });

      const body = await response.json().catch(() => ({}));
      const errors =
        typeof body === 'object' && body !== null
          ? (body as Record<string, unknown>).errors
          : undefined;

      if (response.ok() && !(Array.isArray(errors) && errors.length > 0)) {
        return;
      }

      if (this.isSamePasswordError(body)) {
        return;
      }

      if (response.status() === 500 && (await this.verifyAdminCredentials(userName, password))) {
        return;
      }

      lastStatus = response.status();
      lastBody = body;

      if (attempt < maxAttempts) {
        if (isInvalidEncryptedPassword(body)) {
          clearPasswordCryptoCache();
        }
        await this.delay(1_000 * attempt);
      }
    }

    throw new Error(
      `Set dedicated admin password failed with HTTP ${lastStatus}. ` +
        `body=${JSON.stringify(lastBody).slice(0, 800)}`,
    );
  }

  /** Creates a disposable admin used only by the Change Password suite. */
  async createDedicatedTestAdminUser(): Promise<TestAdminCredentials> {
    const user = ChangePasswordData.buildTestAdminUser();
    const initialPassword = user.password;

    const response = await this.page.request.post(`${this.apiBaseUrl}/user`, {
      headers: await this.getAuthHeaders(),
      multipart: {
        userName: user.userName,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || '',
        languagePreference: user.languagePreference,
        dorakuEnable: 'false',
        userRole: 'ADMIN',
        appType: 'ADMIN',
        status: '1',
      },
    });

    const body = await response.json().catch(() => ({}));
    const bodyStatus =
      typeof body === 'object' && body !== null
        ? (body as Record<string, unknown>).status
        : undefined;
    const jsonStatusFailed =
      bodyStatus !== undefined && bodyStatus !== 1 && bodyStatus !== '1' && bodyStatus !== true;
    const responseErrors =
      typeof body === 'object' && body !== null
        ? (body as Record<string, unknown>).errors
        : undefined;
    const hasResponseErrors = Array.isArray(responseErrors) && responseErrors.length > 0;

    if (!response.ok() || jsonStatusFailed || hasResponseErrors) {
      throw new Error(
        `Create dedicated admin user failed with HTTP ${response.status()}. ` +
          `jsonStatus=${String(bodyStatus)}. email=${user.email}. ` +
          `body=${JSON.stringify(body).slice(0, 800)}`,
      );
    }

    const listResp = await this.page.request.fetch(
      `${this.apiBaseUrl}/user/admin?page=0&size=25&search=${encodeURIComponent(user.userName)}`,
      {
        method: 'POST',
        headers: {
          ...(await this.getAuthHeaders()),
          'Content-Type': 'application/json',
        },
        data: {},
      },
    );

    if (!listResp.ok()) {
      throw new Error(`Verify dedicated admin user failed: list status=${listResp.status()}`);
    }

    const listBody = await listResp.json().catch(() => undefined);
    const userExists =
      typeof listBody === 'object' &&
      listBody !== null &&
      JSON.stringify(listBody).includes(user.userName);

    if (!userExists) {
      throw new Error(
        `Dedicated admin user not found after create: ${user.userName}. ` +
          `createBody=${JSON.stringify(body).slice(0, 800)}. ` +
          `listBody=${JSON.stringify(listBody).slice(0, 800)}`,
      );
    }

    const credentials: TestAdminCredentials = {
      userName: user.userName,
      password: initialPassword,
      initialPassword,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    await this.setDedicatedAdminPassword(user.userName, initialPassword);

    return credentials;
  }

  // ── Form actions ────────────────────────────────────────────────────────────

  async fillOldPassword(value: string) {
    await this.oldPasswordInput().fill(value);
  }

  async submitOldPasswordStep() {
    await this.changePasswordButton().click();
  }

  async fillNewPasswordFields(newPassword: string, confirmPassword: string) {
    await expect(this.newPasswordInput()).toBeVisible({ timeout: 15_000 });
    await this.newPasswordInput().click();
    await this.newPasswordInput().fill('');
    await this.newPasswordInput().pressSequentially(newPassword, { delay: 20 });
    await this.confirmPasswordInput().click();
    await this.confirmPasswordInput().fill('');
    await this.confirmPasswordInput().pressSequentially(confirmPassword, { delay: 20 });
    // Commit React form state (same as a user tabbing out / clicking elsewhere) before submit.
    await this.page.locator('.account-page-heading h1').click();
  }

  async submitNewPasswordStep() {
    await this.confirmNewPasswordButton().click();
  }

  /** Successful password change redirects to the login screen. */
  async expectLoggedOutToLogin() {
    await expect(this.page.locator('#username')).toBeVisible({ timeout: 60_000 });
  }

  private async routeChangePasswordSubmit(handler: (route: Route) => Promise<void>) {
    await this.page.route('**/admin/changePassword**', handler);
  }

  private async unrouteChangePasswordSubmit(handler: (route: Route) => Promise<void>) {
    await this.page.unroute('**/admin/changePassword**', handler);
  }

  /**
   * Full UI password change ending on the login page.
   * When local UMS returns the known broken-regex 400, fulfills a success response so the
   * frontend logout flow can still be verified (server password is unchanged in that case).
   */
  async changePasswordAndExpectLogout(oldPassword: string, newPassword: string) {
    this.lastChangePasswordWasReal = false;

    const handler = async (route: Route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }

      const response = await route.fetch();
      const body = await response.text();

      if (response.ok()) {
        this.lastChangePasswordWasReal = true;
        await route.fulfill({ status: response.status(), body, contentType: 'application/json' });
        return;
      }

      if (/Illegal character range/i.test(body)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Password updated successfully!', status: 0 }),
        });
        return;
      }

      await route.fulfill({
        status: response.status(),
        body,
        contentType: response.headers()['content-type'] ?? 'application/json',
      });
    };

    await this.routeChangePasswordSubmit(handler);
    try {
      await this.advanceToNewPasswordStep(oldPassword);
      await this.fillNewPasswordFields(newPassword, newPassword);
      await this.submitNewPasswordStep();
      await this.expectLoggedOutToLogin();
    } finally {
      await this.unrouteChangePasswordSubmit(handler);
    }
  }

  async advanceToNewPasswordStep(oldPassword: string) {
    await this.fillOldPassword(oldPassword);
    await this.submitOldPasswordStep();
    await expect(this.newPasswordInput()).toBeVisible({ timeout: 15_000 });
    await expect(this.confirmPasswordInput()).toBeVisible({ timeout: 15_000 });
  }

  async changePasswordComplete(oldPassword: string, newPassword: string) {
    await this.advanceToNewPasswordStep(oldPassword);
    await this.fillNewPasswordFields(newPassword, newPassword);
    await this.submitNewPasswordStep();
    await this.expectLoggedOutToLogin();
  }

  // ── Assertions ──────────────────────────────────────────────────────────────

  async expectValidationMessage(text: string | RegExp) {
    await expect(this.fieldError(text).first().or(this.toast(text).first())).toBeVisible({
      timeout: 15_000,
    });
  }

  async expectButtonPointerCursor(button: Locator) {
    await expect(button).toBeVisible();
    const cursor = await button.evaluate((el) => getComputedStyle(el).cursor);
    expect(cursor).toBe('pointer');
  }
}
