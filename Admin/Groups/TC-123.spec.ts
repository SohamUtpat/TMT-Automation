import { test, expect } from '../fixtures/groups.fixture';

test('TC_AP_123 - Verify Navigate to First and Last Page', async ({ groupsPage }) => {
  await groupsPage.expectGroupsLoaded();
  await expect(groupsPage.pagination()).toBeVisible();

  const nextDisabled = await groupsPage.nextPageButton().getAttribute('aria-disabled');
  if (nextDisabled !== 'true') {
    await groupsPage.lastPageButton().click();
    await groupsPage.page.waitForTimeout(500);

    await expect(groupsPage.nextPageButton()).toHaveAttribute('aria-disabled', 'true');

    await groupsPage.firstPageButton().click();
    await groupsPage.page.waitForTimeout(500);

    await expect(groupsPage.prevPageButton()).toHaveAttribute('aria-disabled', 'true');
    await expect(groupsPage.pageNumber(1)).toHaveClass(/ant-pagination-item-active/);
  } else {
    await expect(groupsPage.prevPageButton()).toHaveAttribute('aria-disabled', 'true');
    await expect(groupsPage.nextPageButton()).toHaveAttribute('aria-disabled', 'true');
  }
});
