import { test } from '../fixtures/forms.fixture';

test('TC_AP_338 - Verify the cancel button functionality', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();
  await formsPage.openAssignModal(formName);
  await formsPage.cancelAssignModal();
});
