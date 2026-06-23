import { Page, Locator } from '@playwright/test';
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

  async navigate() {
    await this.page.goto(loginData.baseUrl);
  }

  async login(username: string, password: string) {
    await this.username.fill(username);
    await this.password.fill(password);
    await this.loginBtn.click();
  }

  async loginAsAdmin() {
    await this.navigate();
    await this.login(loginData.validUser, loginData.validPassword);
    await this.page.locator('#pageTitle').waitFor({ state: 'visible', timeout: 20_000 });
  }

  async expectLoggedIn() {
    await this.page.locator('#pageTitle').waitFor({ state: 'visible', timeout: 15_000 });
    await this.page.getByText(loginData.validUser).first().waitFor({ state: 'visible', timeout: 10_000 });
  }

  async expectInvalidCredentials() {
    await this.page.getByText(loginData.invalidCredentialsMessage).waitFor({
      state: 'visible',
      timeout: 10_000,
    });
  }
}
