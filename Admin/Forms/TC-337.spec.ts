import { test, expect } from '../fixtures/forms.fixture';

test('TC_AP_337 - Verify Save button functionality', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();
  const group = await formsPage.prepareGroupFromApi();

  await formsPage.openAssignModal(formName);
  await formsPage.selectGroupInAssignDropdown(`${group.code}-${group.name}`);
  await formsPage.saveAssignModal();
  await expect(formsPage.assignModal()).toBeHidden();
});
