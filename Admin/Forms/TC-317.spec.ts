import { test, expect } from '../fixtures/forms.fixture';

test('TC_AP_317 - Verify pagination works when forms exceed page limit', async ({ formsPage }) => {
  await expect(formsPage.pagination()).toBeVisible();

  if (await formsPage.hasMultiplePages()) {
    const page1Names = await formsPage.getVisibleFormNames();
    await formsPage.goToNextPage();
    const page2Names = await formsPage.getVisibleFormNames();
    expect(page2Names).not.toEqual(page1Names);
    await formsPage.goToFirstPage();
  } else {
    await expect(formsPage.nextPageButton()).toHaveAttribute('aria-disabled', 'true');
  }
});
