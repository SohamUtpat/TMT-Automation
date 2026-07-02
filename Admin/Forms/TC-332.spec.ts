import { test, expect } from '../fixtures/forms.fixture';

test('TC_AP_332 - Verify group names and codes are displayed correctly', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();
  const group = await formsPage.prepareGroupFromApi();

  await formsPage.openAssignModal(formName);
  await formsPage.openAssignGroupsDropdown();

  const labels = await formsPage.getAssignCheckboxLabels();
  const matching = labels.find((label) => label.includes(group.code) && label.includes(group.name));
  expect(matching).toBeTruthy();
});
