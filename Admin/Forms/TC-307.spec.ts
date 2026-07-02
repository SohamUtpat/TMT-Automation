import { test, expect } from '../fixtures/forms.fixture';
import { FormsData } from '../data/FormsData';

test('TC_AP_307 - Verify Forms page loads successfully', async ({ formsPage }) => {
  await expect(formsPage.page).toHaveURL(new RegExp(`${FormsData.path}$`));
  await formsPage.expectFormsLoaded();
});
