import { test as base } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';

type DashboardFixtures = {
  dashboardPage: DashboardPage;
};

export const test = base.extend<DashboardFixtures>({
  dashboardPage: async ({ page }, use) => {
    const login = new LoginPage(page);
    await login.loginAsAdmin();
    await use(new DashboardPage(page));
  },
});

export { expect } from '@playwright/test';
