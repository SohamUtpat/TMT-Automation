import { test } from '../fixtures/change-language.fixture';

test('TC_AP_73 - Verify Language Can Be Changed Back To English', async ({ changeLanguagePage }) => {
  await changeLanguagePage.changeLanguageAndVerify('thai');
  await changeLanguagePage.changeLanguageAndVerify('english');
});
