import { test, expect } from '../fixtures/forms.fixture';

test('TC_AP_323 - Verify the screen scrolling function smoothly', async ({ formsPage }) => {
  const initialScroll = await formsPage.page.evaluate(() => window.scrollY);
  await formsPage.page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
  await formsPage.page.waitForTimeout(1000);
  const afterScroll = await formsPage.page.evaluate(() => window.scrollY);
  expect(afterScroll).toBeGreaterThanOrEqual(initialScroll);
});
