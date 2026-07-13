import { expect, type Locator, type Page } from '@playwright/test';
import { getBaseUrl } from '../config/appConfig';
import { ChangePasswordData } from '../data/ChangePasswordData';
import { loginData } from '../data/loginData';
import { ensureAuthenticated as restoreSession } from '../utils/ensureAuthenticated';

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

  constructor(page: Page) {
    this.page = page;
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  profileDropdown = () => this.page.locator('.dropdown-trigger');

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
    await expect(this.page.locator('#pageTitle')).toHaveText(pageTitle, { timeout: 60_000 });
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
    const base = getBaseUrl();
    return `${base}/api/user-management-service`;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.page.evaluate(() => localStorage.getItem('gulf_net_admin-token'));
    return {
      Authorization: `Bearer ${token ?? ''}`,
      language: 'english',
      Accept: 'application/json, text/plain, */*',
    };
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
        password: initialPassword,
      },
    });

    const body = await response.json().catch(() => ({}));
    const bodyStatus =
      typeof body === 'object' && body !== null
        ? (body as Record<string, unknown>).status
        : undefined;
    const jsonStatusFailed =
      bodyStatus !== undefined && bodyStatus !== 1 && bodyStatus !== '1' && bodyStatus !== true;

    if (!response.ok() || jsonStatusFailed) {
      throw new Error(
        `Create dedicated admin user failed with HTTP ${response.status()}. ` +
          `jsonStatus=${String(bodyStatus)}. body=${JSON.stringify(body).slice(0, 800)}`,
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
      throw new Error(`Dedicated admin user not found after create: ${user.userName}`);
    }

    return {
      userName: user.userName,
      password: initialPassword,
      initialPassword,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
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
    await this.newPasswordInput().fill(newPassword);
    await this.confirmPasswordInput().fill(confirmPassword);
  }

  async submitNewPasswordStep() {
    await this.confirmNewPasswordButton().click();
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
    await expect(this.toast(ChangePasswordData.messages.passwordUpdated)).toBeVisible({ timeout: 60_000 });
    await expect(this.page.locator('#username')).toBeVisible({ timeout: 60_000 });
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
