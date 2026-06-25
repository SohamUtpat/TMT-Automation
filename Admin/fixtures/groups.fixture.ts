import { test as base } from '@playwright/test';
import { GroupsPage } from '../pages/GroupsPage';

type GroupsFixtures = {
  groupsPage: GroupsPage;
};

export const test = base.extend<GroupsFixtures>({
  groupsPage: async ({ page }, use) => {
    const groupsPage = new GroupsPage(page);
    await groupsPage.navigateToGroups();
    await use(groupsPage);
  },
});

export { expect } from '@playwright/test';
