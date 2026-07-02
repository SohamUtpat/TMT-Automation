import { test, expect } from '../fixtures/forms.fixture';

test('TC_AP_328 - Verify removing a selected group', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();
  const group = await formsPage.prepareGroupFromApi();
  const label = `${group.code}-${group.name}`;

  await formsPage.openAssignModal(formName);
  await formsPage.selectGroupInAssignDropdown(label);
  await formsPage.removeSelectedGroupTag(new RegExp(group.name, 'i'));

  const selectedTag = formsPage.assignModal().locator('button').filter({ hasText: new RegExp(group.name, 'i') });
  await expect(selectedTag).toHaveCount(0);
});
