import { test as base } from '@playwright/test';
import { MobileUsersPage } from '../pages/MobileUsersPage';

type MobileUsersFixtures = {
  mobileUsersPage: MobileUsersPage;
};

export const test = base.extend<MobileUsersFixtures>({
  mobileUsersPage: async ({ page }, use) => {
    const mobileUsersPage = new MobileUsersPage(page);
    await mobileUsersPage.navigateToListing();
    await use(mobileUsersPage);
  },
});

export { expect } from '@playwright/test';
