import { test, expect } from '../fixtures/forms.fixture';

test('TC_AP_325 - Verify modal title displays correct form name', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();
  await formsPage.openAssignModal(formName);
  await expect(formsPage.assignModalTitle()).toContainText(formName);
});
