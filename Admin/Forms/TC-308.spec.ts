import { test, expect } from '../fixtures/forms.fixture';
import { FormsData } from '../data/FormsData';

test('TC_AP_308 - Verify UI elements on Form page', async ({ formsPage }) => {
  await expect(formsPage.page.locator('#pageTitle')).toHaveText(FormsData.pageTitle);
  await expect(formsPage.searchInput()).toBeVisible();
  await expect(formsPage.table()).toBeVisible();
  await expect(formsPage.formBuilderButton()).toBeVisible();
  await expect(formsPage.formSubmissionsButton()).toBeVisible();

  for (const column of FormsData.tableColumns) {
    await expect(formsPage.sortHeader(column)).toBeVisible();
  }
});
