import { test as base, type BrowserContext, type Page } from '@playwright/test';
import path from 'path';
import { GroupsPage } from '../pages/GroupsPage';

const authFile = path.join(__dirname, '../../playwright/.auth/admin.json');

type GroupsFixtures = {
  groupsPage: GroupsPage;
};

type WorkerFixtures = {
  workerContext: BrowserContext;
  workerPage: Page;
};

export const test = base.extend<GroupsFixtures, WorkerFixtures>({
  workerContext: [
    async ({ browser }, use) => {
      const context = await browser.newContext({ storageState: authFile });
      await use(context);
      await context.close();
    },
    { scope: 'worker' },
  ],

  workerPage: [
    async ({ workerContext }, use) => {
      const page = await workerContext.newPage();
      const groupsPage = new GroupsPage(page);
      await groupsPage.navigateToGroups();
      await use(page);
    },
    { scope: 'worker' },
  ],

  page: async ({ workerPage }, use) => {
    await use(workerPage);
  },

  groupsPage: async ({ workerPage }, use) => {
    const groupsPage = new GroupsPage(workerPage);
    await groupsPage.ensureGroupsReady();
    await use(groupsPage);
    await groupsPage.resetAfterTest();
  },
});

export { expect } from '@playwright/test';
