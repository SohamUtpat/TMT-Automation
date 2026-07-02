import { test, expect } from '../fixtures/forms.fixture';
import { FormsData } from '../data/FormsData';

test('TC_AP_324 - Verify Assign Groups modal opens correctly', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();
  await formsPage.openAssignModal(formName);
  await expect(formsPage.assignGroupsSelect()).toBeVisible();
  await expect(formsPage.assignModal().getByText(FormsData.assignModal.selectGroupsLabel)).toBeVisible();
});
