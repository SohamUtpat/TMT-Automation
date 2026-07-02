import { test, expect } from '../fixtures/forms.fixture';
import { FormsData } from '../data/FormsData';

test('TC_AP_316 - Verify navigation functionality for Form Builder and Form Submissions', async ({
  formsPage,
}) => {
  await formsPage.formBuilderButton().click();
  await expect(formsPage.page).toHaveURL(new RegExp(FormsData.formBuilderPath));
  await formsPage.page.goBack({ waitUntil: 'commit' });
  await formsPage.ensureFormsReady();

  await formsPage.formSubmissionsButton().click();
  await expect(formsPage.page).toHaveURL(new RegExp(FormsData.formSubmissionsPath));
});
