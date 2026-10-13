import { test, expect } from '../fixtures/forms.fixture';
import {
  FormsData,
  type FormBuilderElementType,
} from '../data/FormsData';
import type { FormBuilderPage } from '../pages/FormBuilderPage';

type BasicElementType = 'singleLine' | 'numeric' | 'multiLine';

const validOption = { label: 'First option', value: 'first-option' };

function uniqueLabel(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`.slice(
    0,
    FormsData.builder.limits.fieldLabel,
  );
}

async function searchForms(formBuilderPage: FormBuilderPage, name: string) {
  const searchInput = formBuilderPage.page.getByPlaceholder('Search by name');
  const response = formBuilderPage.page.waitForResponse(
    (result) =>
      result.url().includes(FormsData.api.listPath) && result.request().method() === 'GET',
  );
  await searchInput.fill(name);
  const submit = searchInput
    .locator(
      'xpath=ancestor::*[contains(@class,"input") or contains(@class,"search")][1]',
    )
    .getByRole('button')
    .first();
  if (await submit.isVisible().catch(() => false)) {
    await submit.click();
  } else {
    await searchInput.press('Enter');
  }
  await response;
}

async function expectBasicModal(formBuilderPage: FormBuilderPage, type: BasicElementType) {
  await formBuilderPage.openElementModal(type);
  await formBuilderPage.expectElementModal(type);
  await expect(formBuilderPage.fieldDescriptionInput()).toBeVisible();
  await expect(formBuilderPage.modalRequiredCheckbox()).toBeVisible();
  await expect(formBuilderPage.addFieldButton()).toBeVisible();
  await expect(formBuilderPage.cancelElementButton()).toBeVisible();
}

async function expectMandatoryLabel(formBuilderPage: FormBuilderPage, type: FormBuilderElementType) {
  await formBuilderPage.openElementModal(type);
  if (type === 'dropdown') {
    await formBuilderPage.setOption(0, validOption);
  }
  await formBuilderPage.addFieldButton().click();
  await formBuilderPage.expectValidationMessage(FormsData.builder.errors.labelRequired);
  await expect(formBuilderPage.elementModal()).toBeVisible();
}

async function expectSpacesRejected(formBuilderPage: FormBuilderPage, type: FormBuilderElementType) {
  await formBuilderPage.openElementModal(type);
  await formBuilderPage.fieldLabelInput().fill('   ');
  if (type === 'dropdown') {
    await formBuilderPage.setOption(0, validOption);
  }
  await formBuilderPage.addFieldButton().click();
  await formBuilderPage.expectValidationMessage(FormsData.builder.errors.labelRequired);
  await expect(formBuilderPage.elementModal()).toBeVisible();
}

async function expectValidFieldAccepted(
  formBuilderPage: FormBuilderPage,
  type: FormBuilderElementType,
  prefix: string,
) {
  const label = uniqueLabel(prefix);
  const options = type === 'dropdown' ? [validOption] : undefined;
  await formBuilderPage.addElement(type, { label, options });
  await formBuilderPage.expectPreviewElement(label, { required: false });
}

async function expectDescriptionAccepted(
  formBuilderPage: FormBuilderPage,
  type: FormBuilderElementType,
  prefix: string,
) {
  const label = uniqueLabel(prefix);
  const description = 'Optional placeholder text';
  const options = type === 'dropdown' ? [validOption] : undefined;
  await formBuilderPage.addElement(type, { label, description, options });
  await formBuilderPage.expectPreviewElement(label, { description });
}

async function expectEmptyDescriptionAccepted(
  formBuilderPage: FormBuilderPage,
  type: FormBuilderElementType,
  prefix: string,
) {
  const label = uniqueLabel(prefix);
  const options = type === 'dropdown' ? [validOption] : undefined;
  await formBuilderPage.addElement(type, { label, description: '', options });
  await expect(formBuilderPage.previewField(label)).toBeVisible();
  if (type === 'dropdown') {
    const select = formBuilderPage.previewField(label).locator('.ant-select');
    await expect(select).toBeVisible();
    await expect(select.locator('.ant-select-selection-item')).toHaveCount(0);
  } else {
    await expect(formBuilderPage.previewFieldControl(label)).toHaveAttribute('placeholder', '');
  }
}

async function expectRequiredState(
  formBuilderPage: FormBuilderPage,
  type: FormBuilderElementType,
  required: boolean,
  prefix: string,
) {
  const label = uniqueLabel(prefix);
  const options = type === 'dropdown' ? [validOption] : undefined;
  await formBuilderPage.addElement(type, { label, required, options });
  await formBuilderPage.expectPreviewElement(label, { required });
}

async function expectCancelWithoutSaving(
  formBuilderPage: FormBuilderPage,
  type: FormBuilderElementType,
  prefix: string,
) {
  const label = uniqueLabel(prefix);
  await formBuilderPage.openElementModal(type);
  await formBuilderPage.fieldLabelInput().fill(label);
  await formBuilderPage.cancelElementModal();
  await expect(formBuilderPage.previewField(label)).toHaveCount(0);
}

async function expectCloseWithoutSaving(
  formBuilderPage: FormBuilderPage,
  type: FormBuilderElementType,
  prefix: string,
) {
  const label = uniqueLabel(prefix);
  await formBuilderPage.openElementModal(type);
  await formBuilderPage.fieldLabelInput().fill(label);
  await formBuilderPage.elementModal().getByRole('button', { name: 'Close' }).click();
  await expect(formBuilderPage.elementModal()).toBeHidden();
  await expect(formBuilderPage.previewField(label)).toHaveCount(0);
}

async function expectModalReset(
  formBuilderPage: FormBuilderPage,
  type: FormBuilderElementType,
  prefix: string,
) {
  await formBuilderPage.openElementModal(type);
  await formBuilderPage.fieldLabelInput().fill(uniqueLabel(prefix));
  await formBuilderPage.fieldDescriptionInput().fill('Temporary description');
  await formBuilderPage.cancelElementModal();
  await formBuilderPage.openElementModal(type);
  await expect(formBuilderPage.fieldLabelInput()).toHaveValue('');
  await expect(formBuilderPage.fieldDescriptionInput()).toHaveValue('');
  await expect(formBuilderPage.modalRequiredCheckbox()).not.toBeChecked();
}

async function expectMaxFieldLabel(formBuilderPage: FormBuilderPage, type: FormBuilderElementType) {
  await formBuilderPage.openElementModal(type);
  const input = formBuilderPage.fieldLabelInput();
  await expect(input).toHaveAttribute(
    'maxlength',
    String(FormsData.builder.limits.fieldLabel),
  );
  await input.fill('L'.repeat(FormsData.builder.limits.fieldLabel + 10));
  await expect(input).toHaveValue('L'.repeat(FormsData.builder.limits.fieldLabel));
}

test('TC_AP_343 - Verify Form Builder screen loads properly', async ({ formBuilderPage }) => {
  await formBuilderPage.expectBuilderLoaded();
  await expect(formBuilderPage.subtitle()).toBeVisible();
  await expect(formBuilderPage.previewHeading(FormsData.builder.labels.untitledForm)).toBeVisible();
  await expect(formBuilderPage.emptyPreviewMessage()).toBeVisible();
});

test('TC_AP_344 - Verify Available Elements list', async ({ formBuilderPage }) => {
  const types = Object.keys(FormsData.builder.elementTypes) as FormBuilderElementType[];
  await expect(formBuilderPage.formDetailsCard().locator('.ant-list-item')).toHaveCount(types.length);
  for (const type of types) {
    await expect(formBuilderPage.elementLibraryRow(type)).toBeVisible();
    await expect(formBuilderPage.addElementButton(type)).toBeVisible();
  }
});

test('TC_AP_345 - Verify scroll functionality in elements list', async ({ formBuilderPage }) => {
  const scrollArea = formBuilderPage.formDetailsCard().locator('div[style*="overflow-y: auto"]');
  await expect(scrollArea).toBeVisible();
  const dimensions = await scrollArea.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }));
  expect(dimensions.scrollHeight).toBeGreaterThan(dimensions.clientHeight);
  await scrollArea.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect.poll(() => scrollArea.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect(formBuilderPage.addElementButton('time')).toBeVisible();
});

test('TC_AP_346 - Verify the save form button functionality when no mandatory fields are not filled', async ({
  formBuilderPage,
}) => {
  await formBuilderPage.addElement('singleLine', { label: uniqueLabel('Required-name') });
  await expect(formBuilderPage.formNameInput()).toHaveValue('');
  await expect(formBuilderPage.saveFormButton()).toBeEnabled();
  await formBuilderPage.saveFormButton().click();
  await expect(
    formBuilderPage.page.getByText(FormsData.builder.errors.nameRequired, { exact: true }),
  ).toBeVisible();
  await expect(formBuilderPage.page).toHaveURL(new RegExp(`${FormsData.formBuilderPath}/?$`));
});

test('TC_AP_348 - Verify that visibility of back to form & view submission button', async ({
  formBuilderPage,
}) => {
  await expect(formBuilderPage.backToFormsButton()).toBeVisible();
  await expect(formBuilderPage.viewSubmissionsButton()).toBeVisible();
});

test('TC_AP_349 - Verify the navigation of back to form button', async ({ formBuilderPage }) => {
  await formBuilderPage.goBackToForms();
});

test('TC_AP_350 - Verify the navigation of view form submission button', async ({
  formBuilderPage,
}) => {
  await formBuilderPage.goToSubmissions();
});

test('TC_AP_351 - Verify Form Name cannot be left blank while creating or updating a form.', async ({
  formBuilderPage,
}) => {
  await formBuilderPage.addElement('singleLine', { label: uniqueLabel('Blank-name') });
  await formBuilderPage.saveFormButton().click();
  await expect(
    formBuilderPage.page.getByText(FormsData.builder.errors.nameRequired, { exact: true }),
  ).toBeVisible();
});

test('TC_AP_352 - Verify that when the user types Form Name, it should immediately reflect on the preview screen in real time.', async ({
  formBuilderPage,
}) => {
  const name = 'Live preview form';
  await formBuilderPage.formNameInput().fill(name);
  await expect(formBuilderPage.previewHeading(name)).toBeVisible();
});

test('TC_AP_354 - Verify if if Form Name field accepts valid characters.', async ({
  formBuilderPage,
}) => {
  const name = 'Inspection Form 2026 - Area_A';
  await formBuilderPage.formNameInput().fill(name);
  await formBuilderPage.expectFormDetails(name);
  await formBuilderPage.expectPreviewDetails(name);
});

test('TC_AP_355 - Verify real-time preview sync holds even during fast typing.', async ({
  formBuilderPage,
}) => {
  const name = 'Rapidly typed form name';
  await formBuilderPage.formNameInput().pressSequentially(name, { delay: 1 });
  await expect(formBuilderPage.formNameInput()).toHaveValue(name);
  await expect(formBuilderPage.previewHeading(name)).toBeVisible();
});

test('TC_AP_356 - Verify the form name field does not accept more than the allowed limit', async ({
  formBuilderPage,
}) => {
  const limit = FormsData.builder.limits.formName;
  await expect(formBuilderPage.formNameInput()).toHaveAttribute('maxlength', String(limit));
  await formBuilderPage.formNameInput().fill('N'.repeat(limit + 10));
  await expect(formBuilderPage.formNameInput()).toHaveValue('N'.repeat(limit));
  await expect(formBuilderPage.previewHeading('N'.repeat(limit))).toBeVisible();
});

test('TC_AP_357 - Verify updating Form Name after saving', async ({ formBuilderPage }) => {
  const created = formBuilderPage.createUniqueData('357-create');
  const updated = formBuilderPage.createUniqueData('357-update');
  await formBuilderPage.fillFormDetails(created.formName, created.description);
  await formBuilderPage.addElement('singleLine', { label: created.fieldLabel });
  await formBuilderPage.saveDisposableForm(created.formName);

  await searchForms(formBuilderPage, created.formName);
  await formBuilderPage.openExistingFormForEdit(created.formName);
  await formBuilderPage.formNameInput().fill(updated.formName);
  await formBuilderPage.registerDisposableForm(updated.formName);
  await formBuilderPage.updateForm();

  await searchForms(formBuilderPage, updated.formName);
  await formBuilderPage.openExistingFormForEdit(updated.formName);
  await formBuilderPage.expectFormDetails(updated.formName, created.description);
});

test('TC_AP_358 - Verify if preview updates even when user uses Ctrl + Z or Ctrl + Y.', async ({
  formBuilderPage,
}) => {
  const first = 'Undo preview';
  const second = 'Undo preview changed';
  await formBuilderPage.formNameInput().fill(first);
  await formBuilderPage.formNameInput().fill(second);
  await formBuilderPage.formNameInput().press('Control+z');
  await expect(formBuilderPage.previewHeading(first)).toBeVisible();
  await formBuilderPage.formNameInput().press('Control+y');
  await expect(formBuilderPage.previewHeading(second)).toBeVisible();
});

test('TC_AP_359 - Verify error message disappears when user starts typing', async ({
  formBuilderPage,
}) => {
  await formBuilderPage.addElement('singleLine', { label: uniqueLabel('Error-clear') });
  await formBuilderPage.saveFormButton().click();
  const error = formBuilderPage.page.getByText(FormsData.builder.errors.nameRequired, {
    exact: true,
  });
  await expect(error).toBeVisible();
  await formBuilderPage.formNameInput().fill('Valid form name');
  await expect(error).toHaveCount(0);
  await expect(formBuilderPage.previewHeading('Valid form name')).toBeVisible();
});

test('TC_AP_361 - Verify Description field accepts valid text', async ({ formBuilderPage }) => {
  const description = 'Valid description for a routine inspection.';
  await formBuilderPage.formDescriptionInput().fill(description);
  await expect(formBuilderPage.formDescriptionInput()).toHaveValue(description);
});

test('TC_AP_362 - Verify live preview updates when typing in Description field', async ({
  formBuilderPage,
}) => {
  const description = 'Live description preview';
  await formBuilderPage.formDescriptionInput().pressSequentially(description, { delay: 2 });
  await expect(formBuilderPage.previewDescription(description)).toBeVisible();
});

test('TC_AP_363 - Verify Description field can be left empty', async ({ formBuilderPage }) => {
  await expect(formBuilderPage.formDescriptionInput()).toHaveValue('');
  await formBuilderPage.formNameInput().fill('Description optional');
  await formBuilderPage.addElement('singleLine', { label: uniqueLabel('Optional-description') });
  await expect(formBuilderPage.saveFormButton()).toBeEnabled();
  await expect(formBuilderPage.previewHeading('Description optional')).toBeVisible();
});

test('TC_AP_364 - Verify Description field with only spaces is treated as empty', async ({
  formBuilderPage,
}) => {
  await formBuilderPage.formDescriptionInput().fill('     ');
  await expect(formBuilderPage.formDescriptionInput()).toHaveValue('');
  await expect(formBuilderPage.previewArea().locator('p.ant-typography')).toHaveCount(0);
});

test('TC_AP_366 - Verify special characters & emoji in Description', async ({
  formBuilderPage,
}) => {
  const description = 'Safety & quality: 100% ready! ✅ #2026';
  await formBuilderPage.formDescriptionInput().fill(description);
  await expect(formBuilderPage.formDescriptionInput()).toHaveValue(description);
  await expect(formBuilderPage.previewDescription(description)).toBeVisible();
});

test('TC_AP_367 - Verify multiple lines in Description', async ({ formBuilderPage }) => {
  const description = 'First line\nSecond line\nThird line';
  await formBuilderPage.formDescriptionInput().fill(description);
  await expect(formBuilderPage.formDescriptionInput()).toHaveValue(description);
  await expect(formBuilderPage.previewDescription(description)).toBeVisible();
});

test('TC_AP_369 - Verify Description field properly displays in Form Listing', async ({
  formBuilderPage,
}) => {
  const created = formBuilderPage.createUniqueData('369-create');
  const updatedDescription = `Updated listing ${Date.now()}`;
  await formBuilderPage.fillFormDetails(created.formName, created.description);
  await formBuilderPage.addElement('singleLine', { label: created.fieldLabel });
  await formBuilderPage.saveDisposableForm(created.formName);

  await formBuilderPage.openExistingFormForEdit(created.formName);
  await formBuilderPage.formDescriptionInput().fill(updatedDescription);
  await formBuilderPage.updateForm();

  await searchForms(formBuilderPage, created.formName);
  const row = formBuilderPage.page
    .locator('.ant-table-tbody tr.ant-table-row')
    .filter({ hasText: created.formName });
  await expect(row).toBeVisible();
  await expect(row.locator('td').nth(1)).toHaveText(updatedDescription);
});

test('TC_AP_370 - Verify Single Line Text modal opens on clicking the “+” icon', async ({
  formBuilderPage,
}) => {
  await expectBasicModal(formBuilderPage, 'singleLine');
});

test('TC_AP_371 - Verify Field Label is mandatory', async ({ formBuilderPage }) => {
  await expectMandatoryLabel(formBuilderPage, 'singleLine');
});

test('TC_AP_372 - Verify validation when entering only spaces in Field Label', async ({
  formBuilderPage,
}) => {
  await expectSpacesRejected(formBuilderPage, 'singleLine');
});

test('TC_AP_373 - Verify valid Field Label is accepted', async ({ formBuilderPage }) => {
  await expectValidFieldAccepted(formBuilderPage, 'singleLine', 'Single-valid');
});

test('TC_AP_374 - Verify Description placeholder field accepts optional text', async ({
  formBuilderPage,
}) => {
  await expectDescriptionAccepted(formBuilderPage, 'singleLine', 'Single-description');
});

test('TC_AP_375 - Verify Description can be left empty', async ({ formBuilderPage }) => {
  await expectEmptyDescriptionAccepted(formBuilderPage, 'singleLine', 'Single-empty');
});

test('TC_AP_376 - Verify Required checkbox functionality', async ({ formBuilderPage }) => {
  await expectRequiredState(formBuilderPage, 'singleLine', true, 'Single-required');
});

test('TC_AP_377 - Verify unchecked Required checkbox behavior', async ({ formBuilderPage }) => {
  await expectRequiredState(formBuilderPage, 'singleLine', false, 'Single-optional');
});

test('TC_AP_378 - Verify Cancel button closes the modal without saving', async ({
  formBuilderPage,
}) => {
  await expectCancelWithoutSaving(formBuilderPage, 'singleLine', 'Single-cancel');
});

test('TC_AP_379 - Verify Close (X) icon closes modal', async ({ formBuilderPage }) => {
  await expectCloseWithoutSaving(formBuilderPage, 'singleLine', 'Single-close');
});

test('TC_AP_380 - Verify modal resets when reopened', async ({ formBuilderPage }) => {
  await expectModalReset(formBuilderPage, 'singleLine', 'Single-reset');
});

test('TC_AP_381 - Verify maximum character limit for Field Label', async ({
  formBuilderPage,
}) => {
  await expectMaxFieldLabel(formBuilderPage, 'singleLine');
});

test('TC_AP_383 - Verify modal layout/UI elements', async ({ formBuilderPage }) => {
  await expectBasicModal(formBuilderPage, 'singleLine');
  await expect(formBuilderPage.elementModalTitle()).toContainText('Single-line text');
});

test('TC_AP_384 - Verify Numeric Text modal opens on clicking the “+” icon', async ({
  formBuilderPage,
}) => {
  await expectBasicModal(formBuilderPage, 'numeric');
});

test('TC_AP_385 - Verify Field Label is mandatory', async ({ formBuilderPage }) => {
  await expectMandatoryLabel(formBuilderPage, 'numeric');
});

test('TC_AP_386 - Verify validation when entering only spaces in Field Label', async ({
  formBuilderPage,
}) => {
  await expectSpacesRejected(formBuilderPage, 'numeric');
});

test('TC_AP_387 - Verify valid Field Label is accepted', async ({ formBuilderPage }) => {
  await expectValidFieldAccepted(formBuilderPage, 'numeric', 'Numeric-valid');
});

test('TC_AP_388 - Verify Description placeholder field accepts optional text', async ({
  formBuilderPage,
}) => {
  await expectDescriptionAccepted(formBuilderPage, 'numeric', 'Numeric-description');
});

test('TC_AP_389 - Verify Description can be left empty', async ({ formBuilderPage }) => {
  await expectEmptyDescriptionAccepted(formBuilderPage, 'numeric', 'Numeric-empty');
});

test('TC_AP_390 - Verify Required checkbox functionality', async ({ formBuilderPage }) => {
  await expectRequiredState(formBuilderPage, 'numeric', true, 'Numeric-required');
});

test('TC_AP_391 - Verify unchecked Required checkbox behavior', async ({ formBuilderPage }) => {
  await expectRequiredState(formBuilderPage, 'numeric', false, 'Numeric-optional');
});

test('TC_AP_392 - Verify Cancel button closes the modal without saving', async ({
  formBuilderPage,
}) => {
  await expectCancelWithoutSaving(formBuilderPage, 'numeric', 'Numeric-cancel');
});

test('TC_AP_393 - Verify Close (X) icon closes modal', async ({ formBuilderPage }) => {
  await expectCloseWithoutSaving(formBuilderPage, 'numeric', 'Numeric-close');
});

test('TC_AP_394 - Verify modal resets when reopened', async ({ formBuilderPage }) => {
  await expectModalReset(formBuilderPage, 'numeric', 'Numeric-reset');
});

test('TC_AP_395 - Verify maximum character limit for Field Label', async ({
  formBuilderPage,
}) => {
  await expectMaxFieldLabel(formBuilderPage, 'numeric');
});

test('TC_AP_397 - Verify modal layout/UI elements', async ({ formBuilderPage }) => {
  await expectBasicModal(formBuilderPage, 'numeric');
  await expect(formBuilderPage.elementModalTitle()).toContainText('Numeric text');
});

test('TC_AP_398 - Verify Multi Line Text modal opens on clicking the “+” icon', async ({
  formBuilderPage,
}) => {
  await expectBasicModal(formBuilderPage, 'multiLine');
});

test('TC_AP_399 - Verify Field Label is mandatory', async ({ formBuilderPage }) => {
  await expectMandatoryLabel(formBuilderPage, 'multiLine');
});

test('TC_AP_400 - Verify validation when entering only spaces in Field Label', async ({
  formBuilderPage,
}) => {
  await expectSpacesRejected(formBuilderPage, 'multiLine');
});

test('TC_AP_401 - Verify valid Field Label is accepted', async ({ formBuilderPage }) => {
  await expectValidFieldAccepted(formBuilderPage, 'multiLine', 'Multiline-valid');
});

test('TC_AP_402 - Verify Description placeholder field accepts optional text', async ({
  formBuilderPage,
}) => {
  await expectDescriptionAccepted(formBuilderPage, 'multiLine', 'Multiline-description');
});

test('TC_AP_403 - Verify Description can be left empty', async ({ formBuilderPage }) => {
  await expectEmptyDescriptionAccepted(formBuilderPage, 'multiLine', 'Multiline-empty');
});

test('TC_AP_404 - Verify Required checkbox functionality', async ({ formBuilderPage }) => {
  await expectRequiredState(formBuilderPage, 'multiLine', true, 'Multiline-required');
});

test('TC_AP_405 - Verify unchecked Required checkbox behavior', async ({ formBuilderPage }) => {
  await expectRequiredState(formBuilderPage, 'multiLine', false, 'Multiline-optional');
});

test('TC_AP_406 - Verify Cancel button closes the modal without saving', async ({
  formBuilderPage,
}) => {
  await expectCancelWithoutSaving(formBuilderPage, 'multiLine', 'Multiline-cancel');
});

test('TC_AP_407 - Verify Close (X) icon closes modal', async ({ formBuilderPage }) => {
  await expectCloseWithoutSaving(formBuilderPage, 'multiLine', 'Multiline-close');
});

test('TC_AP_408 - Verify modal resets when reopened', async ({ formBuilderPage }) => {
  await expectModalReset(formBuilderPage, 'multiLine', 'Multiline-reset');
});

test('TC_AP_409 - Verify maximum character limit for Field Label', async ({
  formBuilderPage,
}) => {
  await expectMaxFieldLabel(formBuilderPage, 'multiLine');
});

test('TC_AP_411 - Verify modal layout/UI elements', async ({ formBuilderPage }) => {
  await expectBasicModal(formBuilderPage, 'multiLine');
  await expect(formBuilderPage.elementModalTitle()).toContainText('Multi-line text');
});

test('TC_AP_412 - Verify Drop-down list modal opens on clicking the Add icon', async ({
  formBuilderPage,
}) => {
  await formBuilderPage.openElementModal('dropdown');
  await formBuilderPage.expectElementModal('dropdown');
  await expect(formBuilderPage.optionLabelInputs()).toHaveCount(1);
  await expect(formBuilderPage.optionValueInputs()).toHaveCount(1);
});

test('TC_AP_413 - Verify Field Label is mandatory', async ({ formBuilderPage }) => {
  await expectMandatoryLabel(formBuilderPage, 'dropdown');
});

test('TC_AP_414 - Verify validation when entering only spaces in Field Label', async ({
  formBuilderPage,
}) => {
  await expectSpacesRejected(formBuilderPage, 'dropdown');
});

test('TC_AP_415 - Verify valid Field Label is accepted', async ({ formBuilderPage }) => {
  await expectValidFieldAccepted(formBuilderPage, 'dropdown', 'Dropdown-valid');
});

test('TC_AP_416 - Verify Description placeholder field accepts optional text', async ({
  formBuilderPage,
}) => {
  await expectDescriptionAccepted(formBuilderPage, 'dropdown', 'Dropdown-description');
});

test('TC_AP_417 - Verify Description can be left empty', async ({ formBuilderPage }) => {
  await expectEmptyDescriptionAccepted(formBuilderPage, 'dropdown', 'Dropdown-empty');
});

test('TC_AP_418 - Verify Required checkbox functionality', async ({ formBuilderPage }) => {
  await expectRequiredState(formBuilderPage, 'dropdown', true, 'Dropdown-required');
});

test('TC_AP_419 - Verify unchecked Required checkbox behavior', async ({
  formBuilderPage,
}) => {
  await expectRequiredState(formBuilderPage, 'dropdown', false, 'Dropdown-optional');
});

test('TC_AP_420 - Verify Cancel button closes the modal without saving', async ({
  formBuilderPage,
}) => {
  await expectCancelWithoutSaving(formBuilderPage, 'dropdown', 'Dropdown-cancel');
});

test('TC_AP_421 - Verify Close (X) icon closes modal', async ({ formBuilderPage }) => {
  await expectCloseWithoutSaving(formBuilderPage, 'dropdown', 'Dropdown-close');
});

test('TC_AP_422 - Verify modal resets when reopened', async ({ formBuilderPage }) => {
  await formBuilderPage.openElementModal('dropdown');
  await formBuilderPage.fillElementModal({
    label: uniqueLabel('Dropdown-reset'),
    description: 'Temporary description',
    required: true,
    options: [validOption, { label: 'Second option', value: 'second-option' }],
  });
  await formBuilderPage.cancelElementModal();
  await formBuilderPage.openElementModal('dropdown');
  await expect(formBuilderPage.fieldLabelInput()).toHaveValue('');
  await expect(formBuilderPage.fieldDescriptionInput()).toHaveValue('');
  await expect(formBuilderPage.modalRequiredCheckbox()).not.toBeChecked();
  await expect(formBuilderPage.optionLabelInputs()).toHaveCount(
    FormsData.builder.limits.initialOptionRows,
  );
  await expect(formBuilderPage.optionLabelInputs().first()).toHaveValue('');
  await expect(formBuilderPage.optionValueInputs().first()).toHaveValue('');
});

test('TC_AP_423 - Verify maximum character limit for Field Label', async ({
  formBuilderPage,
}) => {
  await expectMaxFieldLabel(formBuilderPage, 'dropdown');
});

test('TC_AP_425 - Verify modal layout/UI elements', async ({ formBuilderPage }) => {
  await formBuilderPage.openElementModal('dropdown');
  await expect(formBuilderPage.elementModalTitle()).toContainText('Drop-down list');
  await expect(formBuilderPage.fieldLabelInput()).toBeVisible();
  await expect(formBuilderPage.fieldDescriptionInput()).toBeVisible();
  await expect(formBuilderPage.optionLabelInputs()).toHaveCount(1);
  await expect(formBuilderPage.optionValueInputs()).toHaveCount(1);
  await expect(formBuilderPage.addOptionButton()).toBeVisible();
  await expect(formBuilderPage.modalRequiredCheckbox()).toBeVisible();
  await expect(formBuilderPage.addFieldButton()).toBeVisible();
  await expect(formBuilderPage.cancelElementButton()).toBeVisible();
});

test('TC_AP_426 - Verify default number of option rows', async ({ formBuilderPage }) => {
  await formBuilderPage.openElementModal('dropdown');
  await expect(formBuilderPage.optionLabelInputs()).toHaveCount(
    FormsData.builder.limits.initialOptionRows,
  );
  await expect(formBuilderPage.optionValueInputs()).toHaveCount(
    FormsData.builder.limits.initialOptionRows,
  );
});

test('TC_AP_427 - Verify Option Label and Option Value both are mandatory', async ({
  formBuilderPage,
}) => {
  await formBuilderPage.openElementModal('dropdown');
  await formBuilderPage.fieldLabelInput().fill(uniqueLabel('Dropdown-option-required'));
  await formBuilderPage.addFieldButton().click();
  await formBuilderPage.expectValidationMessage(FormsData.builder.errors.optionRequired);
  await expect(formBuilderPage.elementModal()).toBeVisible();
});

test('TC_AP_428 - Verify entering only spaces in Option Label / Option Value', async ({
  formBuilderPage,
}) => {
  await formBuilderPage.openElementModal('dropdown');
  await formBuilderPage.fieldLabelInput().fill(uniqueLabel('Dropdown-option-spaces'));
  await formBuilderPage.optionLabelInputs().first().fill('   ');
  await formBuilderPage.optionValueInputs().first().fill('   ');
  await formBuilderPage.addFieldButton().click();
  await formBuilderPage.expectValidationMessage(FormsData.builder.errors.optionRequired);
  await expect(formBuilderPage.elementModal()).toBeVisible();
});

test('TC_AP_429 - Verify new option row appears when “Add option” is clicked.', async ({
  formBuilderPage,
}) => {
  await formBuilderPage.openElementModal('dropdown');
  await expect(formBuilderPage.optionLabelInputs()).toHaveCount(1);
  await formBuilderPage.addOptionButton().click();
  await expect(formBuilderPage.optionLabelInputs()).toHaveCount(2);
  await expect(formBuilderPage.optionValueInputs()).toHaveCount(2);
});

test('TC_AP_430 - Verify Remove option removes only the selected option', async ({
  formBuilderPage,
}) => {
  await formBuilderPage.openElementModal('dropdown');
  const options = [
    { label: 'Keep first', value: 'keep-first' },
    { label: 'Remove middle', value: 'remove-middle' },
    { label: 'Keep last', value: 'keep-last' },
  ];
  await formBuilderPage.setOptions(options);
  await formBuilderPage.removeOption(1);
  await formBuilderPage.expectOptionRows([options[0], options[2]]);
});

test('TC_AP_431 - Verify minimum one option is required', async ({ formBuilderPage }) => {
  await formBuilderPage.openElementModal('dropdown');
  await formBuilderPage.fieldLabelInput().fill(uniqueLabel('Dropdown-min-option'));
  await formBuilderPage.removeOption(0);
  await expect(formBuilderPage.optionLabelInputs()).toHaveCount(0);
  await formBuilderPage.addFieldButton().click();
  await formBuilderPage.expectValidationMessage(/at least one option/i);
  await expect(formBuilderPage.elementModal()).toBeVisible();
});

test('TC_AP_433 - Verify special characters in Option Label / Option Value', async ({
  formBuilderPage,
}) => {
  const label = uniqueLabel('Dropdown-special');
  const option = { label: 'R&D / QA ✅', value: 'r&d/qa#100%' };
  await formBuilderPage.addElement('dropdown', { label, options: [option] });
  const select = formBuilderPage.previewField(label).locator('.ant-select');
  await select.click();
  await expect(
    formBuilderPage.page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)'),
  ).toContainText(option.label);
});

test('TC_AP_434 - Verify option order is preserved in preview', async ({
  formBuilderPage,
}) => {
  const label = uniqueLabel('Dropdown-order');
  const options = [
    { label: 'Alpha', value: 'alpha' },
    { label: 'Bravo', value: 'bravo' },
    { label: 'Charlie', value: 'charlie' },
  ];
  await formBuilderPage.addElement('dropdown', { label, options });
  await formBuilderPage.previewField(label).locator('.ant-select').click();
  const optionTexts = await formBuilderPage.page
    .locator(
      '.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option-content',
    )
    .allTextContents();
  expect(optionTexts.map((text) => text.trim())).toEqual(options.map((option) => option.label));
});

test('TC_AP_437 - Verify clicking Add Option multiple times', async ({ formBuilderPage }) => {
  await formBuilderPage.openElementModal('dropdown');
  await formBuilderPage.addOptionButton().click();
  await formBuilderPage.addOptionButton().click();
  await formBuilderPage.addOptionButton().click();
  await expect(formBuilderPage.optionLabelInputs()).toHaveCount(4);
  await expect(formBuilderPage.optionValueInputs()).toHaveCount(4);
});

test('TC_AP_438 - Verify behavior when modal is closed without saving', async ({
  formBuilderPage,
}) => {
  const label = uniqueLabel('Dropdown-unsaved');
  await formBuilderPage.openElementModal('dropdown');
  await formBuilderPage.fillElementModal({
    label,
    description: 'Unsaved dropdown',
    required: true,
    options: [validOption, { label: 'Second option', value: 'second-option' }],
  });
  await formBuilderPage.elementModal().getByRole('button', { name: 'Close' }).click();
  await expect(formBuilderPage.elementModal()).toBeHidden();
  await expect(formBuilderPage.previewField(label)).toHaveCount(0);

  await formBuilderPage.openElementModal('dropdown');
  await expect(formBuilderPage.fieldLabelInput()).toHaveValue('');
  await expect(formBuilderPage.fieldDescriptionInput()).toHaveValue('');
  await expect(formBuilderPage.modalRequiredCheckbox()).not.toBeChecked();
  await expect(formBuilderPage.optionLabelInputs()).toHaveCount(1);
  await expect(formBuilderPage.optionLabelInputs().first()).toHaveValue('');
  await expect(formBuilderPage.optionValueInputs().first()).toHaveValue('');
  await formBuilderPage.cancelElementModal();
});

test('TC_AP_440 - Verify once dropdown field is added then in preview page it should appear as dropdown', async ({
  formBuilderPage,
}) => {
  const label = uniqueLabel('Dropdown-preview');
  const options = [
    { label: 'Open', value: 'open' },
    { label: 'Closed', value: 'closed' },
  ];
  await formBuilderPage.addElement('dropdown', {
    label,
    description: 'Choose status',
    options,
  });
  const select = formBuilderPage.previewField(label).locator('.ant-select');
  await expect(select).toBeVisible();
  await expect(select.locator('.ant-select-selection-placeholder')).toHaveText('Choose status');
  await select.click();
  const dropdown = formBuilderPage.page.locator(
    '.ant-select-dropdown:not(.ant-select-dropdown-hidden)',
  );
  await expect(dropdown).toBeVisible();
  await expect(dropdown.locator('.ant-select-item-option-content')).toHaveText(
    options.map((option) => option.label),
  );
});
