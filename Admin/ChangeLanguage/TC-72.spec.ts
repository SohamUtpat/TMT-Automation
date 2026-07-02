import { test } from '../fixtures/change-language.fixture';

test('TC_AP_72 - Verify Language Can Be Changed To Japanese', async ({ changeLanguagePage }) => {
  await changeLanguagePage.changeLanguageAndVerify('japanese');
});
