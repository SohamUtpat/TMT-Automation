import { getApiBaseUrl } from '../config/appConfig';
import { expect, type Locator, type Page } from '@playwright/test';
import { adminPageTitle } from '../utils/adminPageTitle';
import { ensureAuthenticated as restoreSession } from '../utils/ensureAuthenticated';

type DashboardGroup = {
  name: string;
  hqMembers: number;
  usersCanDelete: number;
  regularUsers: number;
};

type DashboardCounts = {
  mobileUsers: number;
  groups: number;
  admins: number;
  hqMembers: number;
  usersCanDelete: number;
  regularUsers: number;
  groupDetails: DashboardGroup[];
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

  mobileUsersPaginationInfo = () => this.page.locator('.ant-pagination-total-text');

  private waitForDashboardResponse() {
    return this.page
      .waitForResponse(
        (resp) =>
          resp.url().includes('/user-management-service/dashboard') &&
          resp.request().method() === 'GET' &&
          resp.ok(),
        { timeout: 60_000 },
      )
      .then(async (resp) => {
        await this.cacheCountsFromResponse(resp);
        return resp;
      })
      .catch(() => undefined);
  }

  private async cacheCountsFromResponse(
    response: Awaited<ReturnType<Page['waitForResponse']>>,
  ): Promise<void> {
    try {
      const body = await response.json();
      const counts = this.parseDashboardCounts(body);
      if (counts) {
        this.dashboardCountsCache = counts;
      }
    } catch {
      // Fall back to a direct API request in fetchDashboardCounts.
    }
  }

  private parseDashboardCounts(body: unknown): DashboardCounts | null {
    const dashboard = (body as { data?: { dashboard?: Record<string, unknown> } })?.data
      ?.dashboard;

    if (!dashboard || typeof dashboard !== 'object') {
      return null;
    }

    const readCount = (key: string): number => {
      const value = dashboard[key];
      return typeof value === 'number' ? value : Number(value ?? 0);
    };

    const rawGroups = Array.isArray(dashboard.groups) ? dashboard.groups : [];
    const groupDetails: DashboardGroup[] = rawGroups
      .map((group) => {
        const record = group as Record<string, unknown>;
        const name = String(record.groupName ?? '').trim();
        if (!name) return null;

        const readGroupCount = (key: string): number => {
          const value = record[key];
          return typeof value === 'number' ? value : Number(value ?? 0);
        };

        return {
          name,
          hqMembers: readGroupCount('totalHQMobileUsers'),
          usersCanDelete: readGroupCount('totalDeleteMobileUsers'),
          regularUsers: readGroupCount('totalBasicMobileUsers'),
        };
      })
      .filter((group): group is DashboardGroup => group !== null);

    return {
      mobileUsers: readCount('totalMobileUsers'),
      groups: readCount('totalGroups'),
      admins: readCount('totalAdminUsers'),
      hqMembers: readCount('totalHQMobileUsers'),
      usersCanDelete: readCount('totalDeleteMobileUsers'),
      regularUsers: readCount('totalBasicMobileUsers'),
      groupDetails,
    };
  }

  async navigateToDashboard() {
    await this.ensureAuthenticated();

    if (/\/dashboard(?:\/|$|\?)/.test(this.page.url())) {
      if (await this.totalMobileAppUsers().isVisible().catch(() => false)) {
        await this.expectDashboardLoaded();
        return;
      }
    }

    this.dashboardCountsCache = null;
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
        this.dashboardCountsCache = null;
        const dashboardApi = this.waitForDashboardResponse();
        await this.page.reload({ waitUntil: 'commit', timeout: 120_000 });
        await dashboardApi;
      });
    }

    await expect(adminPageTitle(this.page)).toHaveText('Dashboard', { timeout: 15_000 });
    await expect(this.totalMobileAppUsers()).toBeVisible({ timeout: 45_000 });
  }

  /** Reload dashboard and refresh the API counts cache (TC_AP_282). */
  async refreshDashboard() {
    this.dashboardCountsCache = null;
    const dashboardApi = this.waitForDashboardResponse();
    await this.page.reload({ waitUntil: 'commit', timeout: 120_000 });
    await dashboardApi;
    await this.expectDashboardLoaded();
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

    // Prefer reusing the UI's dashboard XHR (same proxy path the SPA uses).
    const networkWait = this.waitForDashboardResponse();
    await this.page.reload({ waitUntil: 'commit', timeout: 120_000 });
    await networkWait;

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
    const counts = this.parseDashboardCounts(body);

    if (!counts) {
      throw new Error('API GET /dashboard returned an unexpected payload');
    }

    this.dashboardCountsCache = counts;
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

  async getApiRegularUsersCount(): Promise<number> {
    return (await this.fetchDashboardCounts()).regularUsers;
  }

  /** Group names that have zero users of every category (should not appear on the graph). */
  async getApiEmptyGroupNames(): Promise<string[]> {
    const details = (await this.fetchDashboardCounts()).groupDetails;
    return details
      .filter(
        (group) => group.hqMembers + group.usersCanDelete + group.regularUsers === 0,
      )
      .map((group) => group.name);
  }

  /** True when `text` contains the count in plain or locale-formatted form (e.g. 1234 / 1,234). */
  countAppearsInText(text: string, count: number): boolean {
    return text.includes(String(count)) || text.includes(count.toLocaleString());
  }

  async openMobileUsersFromVenn() {
    await expect(this.mobileAppUsersLink()).toBeVisible({ timeout: 15_000 });
    await this.mobileAppUsersLink().click();
    await expect(this.page).toHaveURL(/\/mobile-users(?:\/|$|\?)/, { timeout: 60_000 });
    await expect(adminPageTitle(this.page)).toHaveText(/Mobile Users/i, {
      timeout: 60_000,
    });
  }

  async getMobileUsersListingTotal(): Promise<number> {
    const info = this.mobileUsersPaginationInfo();
    await expect(info).toBeVisible({ timeout: 30_000 });
    const text = (await info.textContent()) ?? '';
    const match = text.match(/of\s+([\d,]+)\s+items/i);
    return match ? Number(match[1].replace(/,/g, '')) : 0;
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

  /** Parse numeric values shown next to tooltip category labels. */
  parseTooltipCounts(tooltip: string): Record<string, number> {
    const result: Record<string, number> = {};
    const pattern =
      /(HQ Members|Users Can Delete|Regular Users)\s*:\s*([\d,]+)/gi;

    for (const match of tooltip.matchAll(pattern)) {
      result[match[1]] = Number(match[2].replace(/,/g, ''));
    }

    return result;
  }
}
