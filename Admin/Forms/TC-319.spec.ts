import { test, expect } from '../fixtures/forms.fixture';

test('TC_AP_319 - Verify Actions Column Icons Visibility', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();

  await expect(formsPage.assignButton(formName)).toBeVisible();
  await expect(formsPage.viewButton(formName)).toBeVisible();
  await expect(formsPage.editButton(formName)).toBeVisible();
  await expect(formsPage.copyButton(formName)).toBeVisible();
  await expect(formsPage.deleteButton(formName)).toBeVisible();
});
