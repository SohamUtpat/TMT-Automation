import { test, expect } from '../fixtures/forms.fixture';

test('TC_AP_313 - Verify Searching matching text should show relevant forms', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();

  await formsPage.searchForms(formName);
  await expect(formsPage.formRow(formName)).toBeVisible();
  const visibleNames = await formsPage.getVisibleFormNames();
  expect(visibleNames.every((name) => name.toLowerCase().includes(formName.toLowerCase()))).toBe(true);
});
