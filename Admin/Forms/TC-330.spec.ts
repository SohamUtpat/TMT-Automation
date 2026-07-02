import { test, expect } from '../fixtures/forms.fixture';

test('TC_AP_330 - Verify unselecting a group from the checklist', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();
  const group = await formsPage.prepareGroupFromApi();
  const label = `${group.code}-${group.name}`;

  await formsPage.openAssignModal(formName);
  await formsPage.selectGroupInAssignDropdown(label);
  await formsPage.unselectGroupInAssignDropdown(label);

  const selectedTag = formsPage.assignModal().locator('button').filter({ hasText: new RegExp(group.name, 'i') });
  await expect(selectedTag).toHaveCount(0);
});
