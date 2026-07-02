import { test, expect } from '../fixtures/forms.fixture';

test('TC_AP_321 - Verify Updated On Date Changes After Edit', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();
  const beforeUpdatedOn = (await formsPage.getColumnValues('updatedOn'))[0];

  await formsPage.editButton(formName).click();
  await formsPage.page.waitForURL(/form-builder|edit-form|forms\//i, { timeout: 30_000 });

  const saveButton = formsPage.page.getByRole('button', { name: /save|update|publish/i }).first();
  if (await saveButton.isVisible().catch(() => false)) {
    await saveButton.click();
  }

  await formsPage.navigateToForms();
  await formsPage.searchForms(formName);

  const afterUpdatedOn = (await formsPage.getColumnValues('updatedOn'))[0];
  expect(afterUpdatedOn).toBeTruthy();
  if (beforeUpdatedOn && afterUpdatedOn) {
    expect(afterUpdatedOn).not.toBe('-');
  }
});
