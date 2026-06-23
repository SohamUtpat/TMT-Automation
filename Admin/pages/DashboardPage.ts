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

  async expectDashboardLoaded() {
    await expect(this.page.locator('#pageTitle')).toHaveText('Dashboard');
    await expect(this.totalMobileAppUsers()).toBeVisible();
  }

  async scrollToGraph() {
    await this.groupUserGraph().scrollIntoViewIfNeeded();
    await expect(this.page.getByText('Users Count')).toBeVisible({ timeout: 10_000 });
  }

  async getTopBoxCount(label: string): Promise<number> {
    const value = this.topBox(label).locator('p.value');
    await expect(value).toBeVisible();
    const text = await value.textContent();
    return Number(text?.trim());
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
