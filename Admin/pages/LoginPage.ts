import { expect, type Locator, type Page, type Response } from '@playwright/test';
import { loginData } from '../data/loginData';

export class LoginPage {
  readonly page: Page;

  readonly username: Locator;
  readonly password: Locator;
  readonly loginBtn: Locator;
  readonly forgotPasswordLink: Locator;
  readonly helpDocumentLink: Locator;
  readonly passwordEyeIcon: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;

    this.username = page.locator('#username');
    this.password = page.locator('#password');
    this.loginBtn = page.locator('button.ant-btn-primary');
    this.forgotPasswordLink = page.getByText('here').first();
    this.helpDocumentLink = page.getByText('here').last();
    this.passwordEyeIcon = page.locator('.ant-input-password-icon, .ant-input-suffix');
    this.errorMessage = page.locator('.ant-message-notice-content');
  }

  private isLoginApiResponse(url: string, method: string): boolean {
    return method === 'POST' && url.includes('/api/user-management-service/admin/login');
  }

  private waitForLoginApi(): Promise<Response> {
    return this.page.waitForResponse(
      (resp) => this.isLoginApiResponse(resp.url(), resp.request().method()),
      { timeout: 10_000 },
    );
  }

  async navigate() {
    await this.page.goto(loginData.baseUrl, {
      waitUntil: 'commit',
      timeout: 60_000,
    });
    await this.username.waitFor({ state: 'visible', timeout: 30_000 });
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

    if (await this.page.locator('#pageTitle').isVisible().catch(() => false)) {
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
      return;
    }

    await this.ensureLoginScreen();
  }

  async ensureLoginScreen() {
    if (await this.isOnCleanLoginScreen()) {
      await this.dismissErrorMessages();
      return;
    }

    const usernameVisible = await this.username.isVisible().catch(() => false);
    const loggedIn = await this.page.locator('#pageTitle').isVisible().catch(() => false);

    if (loggedIn || !usernameVisible) {
      await this.page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await this.navigate();
      return;
    }

    await this.clearLoginForm();
    await this.dismissErrorMessages();
  }

  async resetAfterTest() {
    const loggedIn = await this.page.locator('#pageTitle').isVisible().catch(() => false);

    if (loggedIn) {
      await this.page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
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

  async login(username: string, password: string) {
    const loginResponse = this.waitForLoginApi();
    await this.submitLoginForm(username, password);
    await loginResponse;
  }

  async loginAsAdmin() {
    await this.navigate();
    await this.login(loginData.validUser, loginData.validPassword);
    await this.page.locator('#pageTitle').waitFor({ state: 'visible', timeout: 30_000 });
  }

  async expectLoggedIn() {
    await expect(this.page.locator('#pageTitle')).toBeVisible({ timeout: 15_000 });
    await expect(this.page.getByText(loginData.validUser).first()).toBeVisible({ timeout: 5_000 });
  }

  async expectInvalidCredentials() {
    await expect(this.page.getByText(loginData.invalidCredentialsMessage)).toBeVisible({
      timeout: 2_000,
    });
  }

  async expectEmptyFieldValidationErrors() {
    await expect(this.page.getByText(loginData.usernameRequiredMessage)).toBeVisible();
    await expect(this.page.getByText(loginData.passwordRequiredMessage)).toBeVisible();
  }
}
