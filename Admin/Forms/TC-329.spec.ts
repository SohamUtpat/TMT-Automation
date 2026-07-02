import { test, expect } from '../fixtures/forms.fixture';

test('TC_AP_329 - Verify selecting a new group from the checklist', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();
  const group = await formsPage.prepareGroupFromApi();

  await formsPage.openAssignModal(formName);
  await formsPage.selectGroupInAssignDropdown(`${group.code}-${group.name}`);

  const selectedTag = formsPage.assignModal().locator('button').filter({ hasText: new RegExp(group.name, 'i') });
  await expect(selectedTag).toBeVisible();
});
