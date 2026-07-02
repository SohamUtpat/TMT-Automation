import { test } from '../fixtures/change-language.fixture';

test('TC_AP_71 - Verify Language Can Be Changed To Thai', async ({ changeLanguagePage }) => {
  await changeLanguagePage.changeLanguageAndVerify('thai');
});
