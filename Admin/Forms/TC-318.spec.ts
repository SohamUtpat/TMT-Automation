import { test } from '../fixtures/forms.fixture';

test('TC_AP_318 - Verify the table hovering effect when hover over each row', async ({ formsPage }) => {
  const rowCount = await formsPage.tableRows().count();
  test.skip(rowCount === 0, 'No forms available to verify row hover');

  await formsPage.expectRowHoverHighlight(0);
});
