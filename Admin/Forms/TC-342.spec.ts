import { test, expect } from '../fixtures/forms.fixture';
import { FormsData } from '../data/FormsData';

test('TC_AP_342 - Verify when the searched group is not present it should be handled with no data found msg', async ({
  formsPage,
}) => {
  const formName = await formsPage.getFirstFormName();

  await formsPage.openAssignModal(formName);
  await formsPage.searchGroupsInAssignModal(FormsData.invalidSearchTerm);

  await expect(formsPage.assignNoDataMessage()).toBeVisible({ timeout: 15_000 });
});
