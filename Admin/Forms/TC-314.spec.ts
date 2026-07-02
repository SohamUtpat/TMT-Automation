import { test } from '../fixtures/forms.fixture';
import { FormsData } from '../data/FormsData';

test('TC_AP_314 - Verify Invalid search text', async ({ formsPage }) => {
  await formsPage.searchForms(FormsData.invalidSearchTerm);
  await formsPage.expectInvalidSearchShowsNoResults();
});
