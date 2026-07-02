import { expect, type Locator, type Page } from '@playwright/test';
import { ChangePasswordData } from '../data/ChangePasswordData';
import { loginData } from '../data/loginData';
import { ensureAuthenticated as restoreSession } from '../utils/ensureAuthenticated';

export type TestAdminCredentials = {
  userName: string;
  password: string;
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
    const wantsPasswordRestore = credentials.password !== loginData.validPassword;
    const onLoginPage = await this.page.locator('#username').isVisible().catch(() => false);

    if (wantsPasswordRestore) {
      // Password-change tests land on the login screen after success.
      // Restore the default password so the next spec file can log in.
      if (!onLoginPage) {
        const loggedIn = await this.page.locator('#pageTitle').isVisible().catch(() => false);
        if (!loggedIn) {
          await this.page
            .goto(loginData.baseUrl, { waitUntil: 'commit', timeout: 120_000 })
            .catch(() => undefined);
          await restoreSession(this.page, {
            username: credentials.userName,
            password: credentials.password,
          });
        }
      } else {
        await restoreSession(this.page, {
          username: credentials.userName,
          password: credentials.password,
        });
      }

      await this.navigateToChangePassword();
      await this.changePasswordComplete(credentials.password, loginData.validPassword);
      credentials.password = loginData.validPassword;
      return;
    }

    if (onLoginPage) return;

    const loggedIn = await this.page.locator('#pageTitle').isVisible().catch(() => false);
    if (!loggedIn) {
      await this.page.goto(loginData.baseUrl, { waitUntil: 'commit', timeout: 120_000 }).catch(() => undefined);
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
    const base = (process.env.BASE_URL ?? 'http://18.142.102.68').replace(/\/$/, '');
    return `${base}/api/user-management-service`;
  }

  async createDedicatedTestAdminUser(): Promise<TestAdminCredentials> {
    const user = ChangePasswordData.buildTestAdminUser();
    // Use a known-good password that we verified works with the real login flow.
    // Some environments may accept different password formats for different user-create APIs.
    const initialPassword = loginData.validPassword;

    const result = await this.page.evaluate(
      async ({ apiUrl, payload }) => {
        const token = localStorage.getItem('gulf_net_admin-token');
        const formData = new FormData();

        for (const [key, value] of Object.entries(payload)) {
          formData.append(key, value);
        }

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token ?? ''}`,
            language: 'english',
          },
          body: formData,
        });

        const contentType = response.headers.get('content-type') ?? '';
        let bodyJson: unknown = undefined;
        let bodyText: string = '';

        if (contentType.includes('application/json')) {
          bodyJson = await response.json().catch(() => undefined);
          try {
            bodyText = bodyJson === undefined ? '' : JSON.stringify(bodyJson);
          } catch {
            bodyText = '';
          }
        } else {
          bodyText = await response.text();
        }

        return {
          ok: response.ok,
          status: response.status,
          bodyText,
          bodyJson,
        };
      },
      {
        apiUrl: `${this.apiBaseUrl}/user`,
        payload: {
          userName: user.userName,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          languagePreference: user.languagePreference,
          dorakuEnable: 'false',
          userRole: 'ADMIN',
          appType: 'ADMIN',
          status: '1',
          password: initialPassword,
        },
      },
    );

    const bodyStatus =
      typeof result.bodyJson === 'object' && result.bodyJson !== null
        ? (result.bodyJson as Record<string, unknown>).status
        : undefined;

    const jsonStatusFailed =
      bodyStatus !== undefined && bodyStatus !== 1 && bodyStatus !== '1' && bodyStatus !== true;

    const creationRejected = !result.ok || jsonStatusFailed;
    if (creationRejected) {
      throw new Error(
        `Create admin user API failed (httpOk=${result.ok}) with status ${result.status}. ` +
          `jsonStatus=${String(bodyStatus)}. ` +
          `bodyText=${String(result.bodyText).slice(0, 800)}. ` +
          `bodyJson=${JSON.stringify(result.bodyJson).slice(0, 800)}`,
      );
    }

    const looksLikeValidPassword = (candidate: unknown): candidate is string => {
      if (typeof candidate !== 'string') return false;
      // Matches the generator pattern: 8–15 chars, uppercase, lowercase, number, special.
      return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,15}$/.test(candidate);
    };

    const bodyJson = result.bodyJson as Record<string, unknown> | null;
    const candidateFromJson =
      bodyJson?.password ??
      bodyJson?.tempPassword ??
      bodyJson?.temporaryPassword ??
      bodyJson?.initialPassword;

    const candidateFromText =
      typeof result.bodyText === 'string'
        ? result.bodyText.match(/(?:temp|temporary|initial|default)?password"\s*:\s*"([^"]+)"/i)?.[1] ??
          result.bodyText.match(/(?:temp|temporary|initial|default)?password\s*=\s*([^\s,}]+)/i)?.[1]
        : undefined;

    const finalPasswordCandidate = candidateFromJson ?? candidateFromText;
    const finalPassword = looksLikeValidPassword(finalPasswordCandidate)
      ? finalPasswordCandidate
      : initialPassword;

    // Verify the user exists (creation APIs sometimes return HTTP 2xx even when the record isn't created).
    const token = await this.page.evaluate(() => localStorage.getItem('gulf_net_admin-token'));
    const listResp = await this.page.request.fetch(
      `${this.apiBaseUrl}/user/admin?page=0&size=25&search=${encodeURIComponent(user.userName)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token ?? ''}`,
          'Content-Type': 'application/json',
          language: 'english',
          Accept: 'application/json, text/plain, */*',
        },
        data: {},
      },
    );

    if (!listResp.ok) {
      throw new Error(`Verify created admin user failed: list status=${listResp.status()}`);
    }

    const listBody = await listResp.json().catch(() => undefined);
    const userExists = typeof listBody === 'object' && listBody !== null && JSON.stringify(listBody).includes(user.userName);
    if (!userExists) {
      throw new Error(
        `Verify created admin user failed: userName not found in list response. ` +
          `userName=${user.userName}`,
      );
    }

    return {
      userName: user.userName,
      password: finalPassword,
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
