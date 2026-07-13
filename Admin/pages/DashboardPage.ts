import { getApiBaseUrl } from '../config/appConfig';
import { expect, type Locator, type Page } from '@playwright/test';
import { ensureAuthenticated as restoreSession } from '../utils/ensureAuthenticated';

type DashboardCounts = {
  mobileUsers: number;
  groups: number;
  admins: number;
  hqMembers: number;
  usersCanDelete: number;
};

export class DashboardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  topBox(label: string): Locator {
    return this.page.locator('.dashboard-item').filter({
      has: this.page.locator('p.title', { hasText: label }),
    });
  }

  totalMobileAppUsers = () => this.topBox('Mobile App Users');
  totalHQMembers = () => this.topBox('HQ Members');
  totalUsersCanDelete = () => this.topBox('Users Can Delete');
  totalGroups = () => this.topBox('Total Groups');
  totalAdmins = () => this.topBox('Admins');

  vennSection = () =>
    this.page.locator('.ant-card').filter({ has: this.page.getByText(/Mobile App Users\s*>/) });

  vennDiagram = () => this.vennSection();

  mobileAppUsersLink = () => this.page.getByText(/Mobile App Users\s*>/);

  groupUserGraph = () => this.page.locator('.recharts-wrapper').last();

  graphBars = () => this.page.locator('.recharts-bar-rectangle');

  graphTooltip = () => this.page.locator('.recharts-tooltip-wrapper');

  xAxisLabels = () =>
    this.page.locator('.recharts-xAxis .recharts-cartesian-axis-tick-value');

  private waitForDashboardResponse() {
    return this.page
      .waitForResponse(
        (resp) => resp.url().includes('/dashboard') && resp.request().method() === 'GET',
        { timeout: 60_000 },
      )
      .catch(() => undefined);
  }

  async navigateToDashboard() {
    await this.ensureAuthenticated();

    if (/\/dashboard(?:\/|$|\?)/.test(this.page.url())) {
      if (await this.totalMobileAppUsers().isVisible().catch(() => false)) {
        await this.expectDashboardLoaded();
        return;
      }
    }

    const dashboardApi = this.waitForDashboardResponse();
    await this.page.goto('/dashboard', { waitUntil: 'commit', timeout: 120_000 });
    await this.ensureAuthenticated();

    if (!/\/dashboard(?:\/|$|\?)/.test(this.page.url())) {
      const retryApi = this.waitForDashboardResponse();
      await this.page.goto('/dashboard', { waitUntil: 'commit', timeout: 120_000 });
      await retryApi;
    } else {
      await dashboardApi;
    }

    await this.expectDashboardLoaded();
  }

  /** Re-login when storageState token was rejected and the app redirected to login. */
  async ensureAuthenticated() {
    await restoreSession(this.page);
  }

  async ensureDashboardReady() {
    if (!/\/dashboard(?:\/|$|\?)/.test(this.page.url())) {
      await this.navigateToDashboard();
      return;
    }

    await this.ensureAuthenticated();
    await this.expectDashboardLoaded();
  }

  async expectDashboardLoaded() {
    const loading = this.page.getByText('Loading...', { exact: true });
    const loadingVisible = await loading.isVisible().catch(() => false);

    if (loadingVisible) {
      await loading.waitFor({ state: 'hidden', timeout: 90_000 }).catch(async () => {
        const dashboardApi = this.waitForDashboardResponse();
        await this.page.reload({ waitUntil: 'commit', timeout: 120_000 });
        await dashboardApi;
      });
    }

    await expect(this.page.locator('#pageTitle')).toHaveText('Dashboard', { timeout: 15_000 });
    await expect(this.totalMobileAppUsers()).toBeVisible({ timeout: 45_000 });
  }

  async scrollToGraph() {
    await this.groupUserGraph().scrollIntoViewIfNeeded();
    await expect(this.page.getByText('Users Count')).toBeVisible({ timeout: 10_000 });
  }

  async getTopBoxCount(label: string): Promise<number> {
    const value = this.topBox(label).locator('p.value');
    await expect(value).toBeVisible({ timeout: 30_000 });
    const text = await value.textContent();
    return Number(text?.trim().replace(/,/g, ''));
  }

  private dashboardCountsCache: DashboardCounts | null = null;

  private get apiBaseUrl(): string {
    return getApiBaseUrl();
  }

  private async fetchDashboardCounts(): Promise<DashboardCounts> {
    if (this.dashboardCountsCache) {
      return this.dashboardCountsCache;
    }

    const token = await this.page.evaluate(() => localStorage.getItem('gulf_net_admin-token'));
    const response = await this.page.request.get(`${this.apiBaseUrl}/dashboard`, {
      headers: {
        Authorization: `Bearer ${token ?? ''}`,
        language: 'english',
        Accept: 'application/json, text/plain, */*',
      },
    });

    if (!response.ok()) {
      throw new Error(`API GET /dashboard failed with status ${response.status()}`);
    }

    const body = await response.json();
    const dashboard = (body as { data?: { dashboard?: Record<string, unknown> } })?.data?.dashboard;

    if (!dashboard || typeof dashboard !== 'object') {
      throw new Error('API GET /dashboard returned an unexpected payload');
    }

    const readCount = (key: string): number => {
      const value = dashboard[key];
      return typeof value === 'number' ? value : Number(value ?? 0);
    };

    this.dashboardCountsCache = {
      mobileUsers: readCount('totalMobileUsers'),
      groups: readCount('totalGroups'),
      admins: readCount('totalAdminUsers'),
      hqMembers: readCount('totalHQMobileUsers'),
      usersCanDelete: readCount('totalDeleteMobileUsers'),
    };

    return this.dashboardCountsCache;
  }

  async getApiMobileUsersCount(): Promise<number> {
    return (await this.fetchDashboardCounts()).mobileUsers;
  }

  async getApiGroupsCount(): Promise<number> {
    return (await this.fetchDashboardCounts()).groups;
  }

  async getApiAdminsCount(): Promise<number> {
    return (await this.fetchDashboardCounts()).admins;
  }

  async getApiHqMembersCount(): Promise<number> {
    return (await this.fetchDashboardCounts()).hqMembers;
  }

  async getApiUsersCanDeleteCount(): Promise<number> {
    return (await this.fetchDashboardCounts()).usersCanDelete;
  }

  async hoverOnGroup(index: number) {
    await this.scrollToGraph();
    const bars = this.graphBars();
    await expect(bars.first()).toBeVisible({ timeout: 10_000 });
    await bars.nth(index).hover({ force: true });
  }

  async getGraphBarCount(): Promise<number> {
    await this.scrollToGraph();
    return this.graphBars().count();
  }

  async getGraphGroupLabels(): Promise<string[]> {
    await this.scrollToGraph();
    const labels = this.xAxisLabels();
    const count = await labels.count();
    const result: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await labels.nth(i).textContent();
      if (text?.trim()) result.push(text.trim());
    }

    return result;
  }

  async getTooltipText(): Promise<string> {
    await expect(this.graphTooltip()).toBeVisible({ timeout: 10_000 });
    return (await this.graphTooltip().innerText()) ?? '';
  }
}
