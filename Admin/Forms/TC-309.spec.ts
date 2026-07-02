import { test, expect } from '../fixtures/forms.fixture';

test('TC_AP_309 - Verify that latest form appear first on the row', async ({ formsPage }) => {
  const createdDates = await formsPage.getColumnValues('createdOn');
  expect(createdDates.length).toBeGreaterThan(0);
  expect(await formsPage.isSortedByDateCreatedDesc(createdDates)).toBe(true);
});
