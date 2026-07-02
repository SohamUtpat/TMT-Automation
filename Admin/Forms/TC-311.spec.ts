import { test } from '../fixtures/forms.fixture';

test('TC_AP_311 - Verify Data Consistency for Each Form', async ({ formsPage }) => {
  await formsPage.expectUiMatchesApi();
});
