import { test } from '../fixtures/forms.fixture';

test('TC_AP_335 - Verify closing modal using X icon', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();
  await formsPage.openAssignModal(formName);
  await formsPage.closeAssignModalWithX();
});
