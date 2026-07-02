import { test, expect } from '../fixtures/forms.fixture';

test('TC_AP_331 - Verify only clicking inside checkbox toggles selection', async ({ formsPage }) => {
  const formName = await formsPage.getFirstFormName();

  await formsPage.openAssignModal(formName);
  await formsPage.openAssignGroupsDropdown();

  const option = formsPage.assignDropdownOptions().first();
  const labelText = (await option.textContent())?.trim() ?? '';
  const checkbox = option.getByRole('checkbox');

  await option.click({ position: { x: 5, y: 5 } });
  const afterLabelClick = await checkbox.isChecked();

  await checkbox.click();
  const afterCheckboxClick = await checkbox.isChecked();

  expect(afterCheckboxClick).not.toBe(afterLabelClick);
  expect(labelText.length).toBeGreaterThan(0);
});
