import { test, expect } from '../fixtures/forms.fixture';

test('TC_AP_326 - Verify all the available group appear in the select group field in checklist manner', async ({
  formsPage,
}) => {
  const formName = await formsPage.getFirstFormName();
  await formsPage.openAssignModal(formName);
  await formsPage.openAssignGroupsDropdown();

  const checkboxCount = await formsPage.assignCheckboxes().count();
  expect(checkboxCount).toBeGreaterThan(0);
});
