import { test, expect } from '../fixtures/forms.fixture';

test('TC_AP_341 - Verify the incremental search in the select group field', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();
  const group = await formsPage.prepareGroupFromApi();
  const partial = group.code.slice(0, Math.max(2, Math.floor(group.code.length / 2)));

  await formsPage.openAssignModal(formName);
  await formsPage.searchGroupsInAssignModal(partial);

  const labels = await formsPage.getAssignCheckboxLabels();
  expect(labels.some((label) => label.toLowerCase().includes(partial.toLowerCase()))).toBe(true);
});
