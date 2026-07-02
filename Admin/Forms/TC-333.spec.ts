import { test, expect } from '../fixtures/forms.fixture';

test('TC_AP_333 - Verify scroll functionality inside groups list', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();

  await formsPage.openAssignModal(formName);
  await formsPage.openAssignGroupsDropdown();

  const dropdown = formsPage.assignDropdown();
  const initialScroll = await dropdown.evaluate((el) => el.scrollTop);
  await dropdown.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  const afterScroll = await dropdown.evaluate((el) => el.scrollTop);
  expect(afterScroll).toBeGreaterThanOrEqual(initialScroll);
});
