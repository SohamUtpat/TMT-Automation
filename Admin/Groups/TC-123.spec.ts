import { test, expect } from '../fixtures/groups.fixture';

test('TC_AP_123 - Verify Navigate to First and Last Page', async ({ groupsPage }) => {
  await expect(groupsPage.pagination()).toBeVisible();

  if (await groupsPage.hasMultiplePages()) {
    await groupsPage.goToLastPage();
    await groupsPage.goToFirstPage();
  } else {
    await expect(groupsPage.prevPageButton()).toHaveAttribute('aria-disabled', 'true');
    await expect(groupsPage.nextPageButton()).toHaveAttribute('aria-disabled', 'true');
  }
});
