import { expect, type Locator, type Page } from '@playwright/test';

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

  async navigateToDashboard() {
    if (/\/dashboard(?:\/|$|\?)/.test(this.page.url())) {
      await expect(this.totalMobileAppUsers()).toBeVisible({ timeout: 15_000 });
      return;
    }

    const dashboardApi = this.page
      .waitForResponse(
        (resp) => resp.url().includes('/dashboard') && resp.request().method() === 'GET',
        { timeout: 60_000 },
      )
      .catch(() => undefined);
    await this.page.goto('/dashboard', { waitUntil: 'commit', timeout: 60_000 });
    await this.page.waitForURL(/\/dashboard(?:\/|$|\?)/, { timeout: 60_000 });
    await dashboardApi;
    await this.expectDashboardLoaded();
  }

  async expectDashboardLoaded() {
    await expect(this.totalMobileAppUsers()).toBeVisible({ timeout: 45_000 });
    await expect(this.page.locator('#pageTitle')).toHaveText('Dashboard', { timeout: 15_000 });
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

  private get apiBaseUrl(): string {
    const base = (process.env.BASE_URL ?? 'http://18.142.102.68').replace(/\/$/, '');
    return `${base}/api/user-management-service`;
  }

  private extractTotalRecords(body: unknown): number {
    if (!body || typeof body !== 'object') {
      return 0;
    }

    const record = body as Record<string, unknown>;
    const metaData = record.metaData;

    if (metaData && typeof metaData === 'object') {
      const totalRecords = (metaData as { totalRecords?: unknown }).totalRecords;
      if (typeof totalRecords === 'number') {
        return totalRecords;
      }
    }

    const nestedData = record.data;
    if (nestedData && typeof nestedData === 'object' && !Array.isArray(nestedData)) {
      const nestedTotal = this.extractTotalRecords(nestedData);
      if (nestedTotal > 0) {
        return nestedTotal;
      }
    }

    if (typeof record.totalRecords === 'number') {
      return record.totalRecords;
    }

    if (typeof record.total === 'number') {
      return record.total;
    }

    return 0;
  }

  private async fetchTotalRecords(
    path: string,
    method: 'GET' | 'POST' = 'GET',
    data: object = {},
  ): Promise<number> {
    const token = await this.page.evaluate(() => localStorage.getItem('gulf_net_admin-token'));

    const response = await this.page.request.fetch(`${this.apiBaseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token ?? ''}`,
        'Content-Type': 'application/json',
        language: 'english',
        Accept: 'application/json, text/plain, */*',
      },
      data: method === 'POST' ? data : undefined,
    });

    if (!response.ok()) {
      throw new Error(`API ${method} ${path} failed with status ${response.status()}`);
    }

    const body = await response.json();
    return this.extractTotalRecords(body);
  }

  async getApiMobileUsersCount(): Promise<number> {
    return this.fetchTotalRecords('/user/mobile?page=0&size=25&search=', 'POST', {});
  }

  async getApiGroupsCount(): Promise<number> {
    return this.fetchTotalRecords('/group?page=0&size=25&search=', 'GET');
  }

  async getApiAdminsCount(): Promise<number> {
    return this.fetchTotalRecords('/user/admin?page=0&size=25&search=', 'POST', {});
  }

  async getApiHqMembersCount(): Promise<number> {
    return this.fetchTotalRecords('/user/mobile?page=0&size=25&search=', 'POST', {
      userRoles: ['HQ'],
    });
  }

  async getApiUsersCanDeleteCount(): Promise<number> {
    return this.fetchTotalRecords('/user/mobile?page=0&size=25&search=', 'POST', {
      userRoles: ['DELETE'],
    });
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
