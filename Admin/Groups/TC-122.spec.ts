import { test, expect } from '../fixtures/groups.fixture';

test('TC_AP_122 - Verify Pagination Navigation Between Pages', async ({ groupsPage }) => {
  await expect(groupsPage.pagination()).toBeVisible();

  if (await groupsPage.hasMultiplePages()) {
    const page1Names = await groupsPage.getVisibleGroupNames();

    await groupsPage.goToNextPage();
    const page2Names = await groupsPage.getVisibleGroupNames();
    expect(page2Names).not.toEqual(page1Names);

    await groupsPage.goToPageNumber(1);
    expect(await groupsPage.getVisibleGroupNames()).toEqual(page1Names);

    await groupsPage.goToPageNumber(2);
  }
});
