import { test } from '../fixtures/forms.fixture';

test('TC_AP_322 - Verify Hyphen Display When Description is Empty', async ({ formsPage }) => {
  await formsPage.expectDescriptionShowsHyphenWhenEmpty();
});
