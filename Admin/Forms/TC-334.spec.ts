import { test } from '../fixtures/forms.fixture';

test('TC_AP_334 - Verify no duplicate group entries', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();

  await formsPage.openAssignModal(formName);
  await formsPage.openAssignGroupsDropdown();
  await formsPage.expectAssignCheckboxLabelsUnique();
});
