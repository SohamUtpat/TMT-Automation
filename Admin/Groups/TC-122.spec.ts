import { test, expect } from '../fixtures/groups.fixture';

test('TC_AP_122 - Verify Pagination Navigation Between Pages', async ({ groupsPage }) => {
  await groupsPage.expectGroupsLoaded();
  await expect(groupsPage.pagination()).toBeVisible();

  const nextDisabled = await groupsPage.nextPageButton().getAttribute('aria-disabled');
  if (nextDisabled !== 'true') {
    const page1Names = await groupsPage.getVisibleGroupNames();
    await groupsPage.nextPageButton().click();
    await groupsPage.page.waitForTimeout(500);

    const page2Names = await groupsPage.getVisibleGroupNames();
    expect(page2Names).not.toEqual(page1Names);

    await groupsPage.pageNumber(1).click();
    await groupsPage.page.waitForTimeout(500);
    expect(await groupsPage.getVisibleGroupNames()).toEqual(page1Names);
  }

  const pageItems = groupsPage.pagination().locator('.ant-pagination-item');
  const pageCount = await pageItems.count();
  if (pageCount > 1) {
    await pageItems.nth(1).click();
    await groupsPage.page.waitForTimeout(500);
    await expect(pageItems.nth(1)).toHaveClass(/ant-pagination-item-active/);
  }
});
