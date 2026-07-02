import { test } from '../fixtures/forms.fixture';

test('TC_AP_336 - Verify clicking outside the modal closes it', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();
  await formsPage.openAssignModal(formName);
  await formsPage.closeAssignModalByClickingOutside();
});
