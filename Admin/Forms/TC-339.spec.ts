import { test, expect } from '../fixtures/forms.fixture';

test('TC_AP_339 - Verify behavior when no groups are available', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();

  await formsPage.openAssignModal(formName);
  await formsPage.searchGroupsInAssignModal('zzzznonexistentgroup99999');

  const noDataVisible = await formsPage.assignNoDataMessage().isVisible().catch(() => false);
  const checkboxCount = await formsPage.assignCheckboxes().count();
  expect(noDataVisible || checkboxCount === 0).toBe(true);
});
