import { test } from '../fixtures/forms.fixture';

test('TC_AP_340 - Verify the hovering effect', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();

  await formsPage.openAssignModal(formName);
  await formsPage.openAssignGroupsDropdown();
  await formsPage.expectAssignOptionHover(0);
});
