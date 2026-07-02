import { test } from '../fixtures/forms.fixture';

test('TC_AP_320 - Verify No Empty Rows', async ({ formsPage }) => {
  await formsPage.expectNoEmptyRows();
});
