import { test, expect } from '../fixtures/forms.fixture';

test('TC_AP_327 - Verify that when the group is selected it should appear in the above space with close icon', async ({
  formsPage,
}) => {
  const formName = await formsPage.getFirstFormName();
  const group = await formsPage.prepareGroupFromApi();

  await formsPage.openAssignModal(formName);
  await formsPage.selectGroupInAssignDropdown(`${group.code}-${group.name}`);

  const selectedTag = formsPage.assignModal().locator('button').filter({ hasText: new RegExp(group.name, 'i') });
  await expect(selectedTag).toBeVisible();
  await expect(selectedTag.locator('.anticon-close, .crossIconCss, [aria-label="close"]')).toBeVisible();
});
