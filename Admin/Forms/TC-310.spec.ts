import { test, expect } from '../fixtures/forms.fixture';

test('TC_AP_310 - Verify Form name and Description Truncation (Ellipsis)', async ({ formsPage }) => {
  const rowCount = await formsPage.tableRows().count();
  test.skip(rowCount === 0, 'No forms available to verify ellipsis');

  await formsPage.expectCellEllipsis('name', 0);
  await formsPage.expectCellEllipsis('description', 0);
});
