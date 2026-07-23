import { test, expect } from '../fixtures/forms.fixture';
import { FormsData, type FormBuilderElementType } from '../data/FormsData';
import type { FormBuilderPage, FormBuilderOption } from '../pages/FormBuilderPage';

type OptionElementType = Extract<FormBuilderElementType, 'checklist' | 'radio'>;

const firstOption: FormBuilderOption = { label: 'First option', value: 'first-option' };
const orderedOptions: FormBuilderOption[] = [
  { label: 'Alpha option', value: 'alpha-option' },
  { label: 'Bravo option', value: 'bravo-option' },
  { label: 'Charlie option', value: 'charlie-option' },
];

function uniqueLabel(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`.slice(
    0,
    FormsData.builder.limits.fieldLabel,
  );
}

async function openOptionModal(formBuilderPage: FormBuilderPage, type: OptionElementType) {
  await formBuilderPage.openElementModal(type);
  await formBuilderPage.expectElementModal(type);
  await expect(formBuilderPage.optionLabelInputs()).toHaveCount(1);
  await expect(formBuilderPage.optionValueInputs()).toHaveCount(1);
}

async function addOptionElement(
  formBuilderPage: FormBuilderPage,
  type: OptionElementType,
  prefix: string,
  options: FormBuilderOption[] = [firstOption],
  required = false,
) {
  const label = uniqueLabel(prefix);
  await formBuilderPage.addElement(type, { label, options, required });
  return label;
}

async function expectOptionFieldLabelRequired(
  formBuilderPage: FormBuilderPage,
  type: OptionElementType,
  value: string,
) {
  await openOptionModal(formBuilderPage, type);
  await formBuilderPage.fieldLabelInput().fill(value);
  await formBuilderPage.setOption(0, firstOption);
  await formBuilderPage.addFieldButton().click();
  await formBuilderPage.expectValidationMessage(FormsData.builder.errors.labelRequired);
  await expect(formBuilderPage.elementModal()).toBeVisible();
}

async function expectOptionRequiredState(
  formBuilderPage: FormBuilderPage,
  type: OptionElementType,
  required: boolean,
  prefix: string,
) {
  const label = await addOptionElement(formBuilderPage, type, prefix, [firstOption], required);
  await expect(formBuilderPage.previewRequiredCheckbox(label)).toBeChecked({ checked: required });
}

async function expectOptionCancel(
  formBuilderPage: FormBuilderPage,
  type: OptionElementType,
  prefix: string,
  closeWithX = false,
) {
  const label = uniqueLabel(prefix);
  await openOptionModal(formBuilderPage, type);
  await formBuilderPage.fillElementModal({ label, options: [firstOption] });
  if (closeWithX) {
    await formBuilderPage.elementModal().getByRole('button', { name: 'Close' }).click();
    await expect(formBuilderPage.elementModal()).toBeHidden();
  } else {
    await formBuilderPage.cancelElementModal();
  }
  await expect(formBuilderPage.previewField(label)).toHaveCount(0);
}

async function expectOptionModalReset(
  formBuilderPage: FormBuilderPage,
  type: OptionElementType,
  prefix: string,
) {
  await openOptionModal(formBuilderPage, type);
  await formBuilderPage.fillElementModal({
    label: uniqueLabel(prefix),
    required: true,
    options: [firstOption, orderedOptions[1]],
  });
  await formBuilderPage.cancelElementModal();
  await openOptionModal(formBuilderPage, type);
  await expect(formBuilderPage.fieldLabelInput()).toHaveValue('');
  await expect(formBuilderPage.modalRequiredCheckbox()).toHaveCount(1);
  await expect(formBuilderPage.modalRequiredCheckbox()).not.toBeChecked();
  await expect(formBuilderPage.optionLabelInputs()).toHaveCount(
    FormsData.builder.limits.initialOptionRows,
  );
  await expect(formBuilderPage.optionLabelInputs().first()).toHaveValue('');
  await expect(formBuilderPage.optionValueInputs().first()).toHaveValue('');
}

async function expectOptionLabelLimit(
  formBuilderPage: FormBuilderPage,
  type: OptionElementType,
) {
  await openOptionModal(formBuilderPage, type);
  const input = formBuilderPage.fieldLabelInput();
  await expect(input).toHaveAttribute('maxlength', String(FormsData.builder.limits.fieldLabel));
  await input.fill('L'.repeat(FormsData.builder.limits.fieldLabel + 10));
  await expect(input).toHaveValue('L'.repeat(FormsData.builder.limits.fieldLabel));
}

async function expectOptionValuesRequired(
  formBuilderPage: FormBuilderPage,
  type: OptionElementType,
  spaces = false,
) {
  await openOptionModal(formBuilderPage, type);
  await formBuilderPage.fieldLabelInput().fill(uniqueLabel(`${type}-option-required`));
  if (spaces) {
    await formBuilderPage.optionLabelInputs().first().fill('   ');
    await formBuilderPage.optionValueInputs().first().fill('   ');
  }
  await formBuilderPage.addFieldButton().click();
  await formBuilderPage.expectValidationMessage(FormsData.builder.errors.optionRequired);
  await expect(formBuilderPage.elementModal()).toBeVisible();
}

async function expectMinimumOptionRequired(
  formBuilderPage: FormBuilderPage,
  type: OptionElementType,
) {
  await openOptionModal(formBuilderPage, type);
  await formBuilderPage.fieldLabelInput().fill(uniqueLabel(`${type}-minimum-option`));
  await formBuilderPage.removeOption(0);
  await expect(formBuilderPage.optionLabelInputs()).toHaveCount(0);
  await formBuilderPage.addFieldButton().click();
  await formBuilderPage.expectValidationMessage(/at least one option/i);
}

async function expectPreviewOptionOrder(
  formBuilderPage: FormBuilderPage,
  type: OptionElementType,
  prefix: string,
) {
  const label = await addOptionElement(formBuilderPage, type, prefix, orderedOptions);
  const wrapperSelector = type === 'checklist' ? '.ant-checkbox-wrapper' : '.ant-radio-wrapper';
  const labels = await formBuilderPage.previewField(label).locator(wrapperSelector).allTextContents();
  expect(
    labels.map((text) => text.trim()).filter((text) => text !== FormsData.builder.labels.required),
  ).toEqual(orderedOptions.map((option) => option.label));
}

async function expectOptionPreview(
  formBuilderPage: FormBuilderPage,
  type: OptionElementType,
  prefix: string,
) {
  const label = await addOptionElement(formBuilderPage, type, prefix, orderedOptions);
  const controls =
    type === 'checklist'
      ? formBuilderPage.previewField(label).getByRole('checkbox')
      : formBuilderPage.previewField(label).getByRole('radio');
  await expect(controls).toHaveCount(
    orderedOptions.length + (type === 'checklist' ? 1 : 0),
  );
  for (const option of orderedOptions) {
    const control =
      type === 'checklist'
        ? formBuilderPage.previewChecklistOption(label, option.label)
        : formBuilderPage.previewRadioOption(label, option.label);
    await expect(control).toBeVisible();
  }
  await expectPreviewOptionOrderInExistingField(formBuilderPage, type, label, orderedOptions);
}

async function expectPreviewOptionOrderInExistingField(
  formBuilderPage: FormBuilderPage,
  type: OptionElementType,
  label: string,
  options: FormBuilderOption[],
) {
  const wrapperSelector = type === 'checklist' ? '.ant-checkbox-wrapper' : '.ant-radio-wrapper';
  const labels = await formBuilderPage.previewField(label).locator(wrapperSelector).allTextContents();
  expect(
    labels.map((text) => text.trim()).filter((text) => text !== FormsData.builder.labels.required),
  ).toEqual(options.map((option) => option.label));
}

async function openSliderModal(formBuilderPage: FormBuilderPage) {
  await formBuilderPage.openElementModal('slider');
  await formBuilderPage.expectElementModal('slider');
  await expect(formBuilderPage.sliderMinimumInput()).toBeVisible();
  await expect(formBuilderPage.sliderMaximumInput()).toBeVisible();
  await expect(formBuilderPage.sliderStepInput()).toBeVisible();
}

async function expectSliderDefaults(formBuilderPage: FormBuilderPage) {
  await expect(formBuilderPage.sliderMinimumInput()).toHaveValue(
    String(FormsData.builder.defaults.slider.min),
  );
  await expect(formBuilderPage.sliderMaximumInput()).toHaveValue(
    String(FormsData.builder.defaults.slider.max),
  );
  expect(Number(await formBuilderPage.sliderStepInput().inputValue())).toBe(
    FormsData.builder.defaults.slider.step,
  );
}

async function addSlider(
  formBuilderPage: FormBuilderPage,
  prefix: string,
  values: { min?: number; max?: number; step?: number; required?: boolean } = {},
) {
  const label = uniqueLabel(prefix);
  await formBuilderPage.addElement('slider', { label, ...values });
  return label;
}

async function expectSliderValidation(
  formBuilderPage: FormBuilderPage,
  input: ReturnType<FormBuilderPage['sliderMinimumInput']>,
  value: string,
  message: string | RegExp,
) {
  await input.fill(value);
  await formBuilderPage.fieldLabelInput().fill(uniqueLabel('Slider-validation'));
  await formBuilderPage.addFieldButton().click();
  await formBuilderPage.expectValidationMessage(message);
  await expect(formBuilderPage.elementModal()).toBeVisible();
}

async function openRatingModal(formBuilderPage: FormBuilderPage) {
  await formBuilderPage.openElementModal('rating');
  await formBuilderPage.expectElementModal('rating');
  await expect(formBuilderPage.ratingStarCountInput()).toBeVisible();
}

async function addRating(
  formBuilderPage: FormBuilderPage,
  prefix: string,
  maxRating = FormsData.builder.defaults.rating.maxRating,
  required = false,
) {
  const label = uniqueLabel(prefix);
  await formBuilderPage.addElement('rating', { label, maxRating, required });
  return label;
}

test('TC_AP_441 - Verify Checklist modal opens on clicking the Add icon', async ({
  formBuilderPage,
}) => {
  await openOptionModal(formBuilderPage, 'checklist');
});

test('TC_AP_442 - Verify Checklist Field Label is mandatory', async ({ formBuilderPage }) => {
  await expectOptionFieldLabelRequired(formBuilderPage, 'checklist', '');
});

test('TC_AP_443 - Verify Checklist rejects spaces-only Field Label', async ({
  formBuilderPage,
}) => {
  await expectOptionFieldLabelRequired(formBuilderPage, 'checklist', '   ');
});

test('TC_AP_444 - Verify Checklist accepts a valid Field Label', async ({
  formBuilderPage,
}) => {
  const label = await addOptionElement(formBuilderPage, 'checklist', 'Checklist-valid');
  await expect(formBuilderPage.previewField(label)).toBeVisible();
});

test('TC_AP_445 - Verify Checklist Description accepts optional text', async () => {
  test.skip(
    true,
    'Current frontend Checklist modal does not provide a Field Description input.',
  );
});

test('TC_AP_446 - Verify Checklist Description can be left empty', async () => {
  test.skip(
    true,
    'Current frontend Checklist modal does not provide a Field Description input to validate as optional.',
  );
});

test('TC_AP_447 - Verify Checklist Required checkbox functionality', async ({
  formBuilderPage,
}) => {
  await expectOptionRequiredState(
    formBuilderPage,
    'checklist',
    true,
    'Checklist-required',
  );
});

test('TC_AP_448 - Verify unchecked Checklist Required behavior', async ({
  formBuilderPage,
}) => {
  await expectOptionRequiredState(
    formBuilderPage,
    'checklist',
    false,
    'Checklist-optional',
  );
});

test('TC_AP_449 - Verify Checklist Cancel closes without saving', async ({
  formBuilderPage,
}) => {
  await expectOptionCancel(formBuilderPage, 'checklist', 'Checklist-cancel');
});

test('TC_AP_450 - Verify Checklist Close icon closes without saving', async ({
  formBuilderPage,
}) => {
  await expectOptionCancel(formBuilderPage, 'checklist', 'Checklist-close', true);
});

test('TC_AP_451 - Verify Checklist modal resets when reopened', async ({
  formBuilderPage,
}) => {
  await expectOptionModalReset(formBuilderPage, 'checklist', 'Checklist-reset');
});

test('TC_AP_452 - Verify Checklist Field Label maximum character limit', async ({
  formBuilderPage,
}) => {
  await expectOptionLabelLimit(formBuilderPage, 'checklist');
});

test('TC_AP_454 - Verify Checklist modal layout and controls', async ({
  formBuilderPage,
}) => {
  await openOptionModal(formBuilderPage, 'checklist');
  await expect(formBuilderPage.elementModalTitle()).toContainText('Checklist');
  await expect(formBuilderPage.addOptionButton()).toBeVisible();
  await expect(formBuilderPage.modalRequiredCheckbox()).toHaveCount(1);
  await expect(formBuilderPage.modalRequiredCheckbox()).toBeVisible();
  await expect(formBuilderPage.addFieldButton()).toBeVisible();
  await expect(formBuilderPage.cancelElementButton()).toBeVisible();
});

test('TC_AP_455 - Verify Checklist default number of option rows', async ({
  formBuilderPage,
}) => {
  await openOptionModal(formBuilderPage, 'checklist');
  await expect(formBuilderPage.optionLabelInputs()).toHaveCount(
    FormsData.builder.limits.initialOptionRows,
  );
});

test('TC_AP_456 - Verify Checklist Option Label and Value are mandatory', async ({
  formBuilderPage,
}) => {
  await expectOptionValuesRequired(formBuilderPage, 'checklist');
});

test('TC_AP_457 - Verify Checklist rejects spaces-only option fields', async ({
  formBuilderPage,
}) => {
  await expectOptionValuesRequired(formBuilderPage, 'checklist', true);
});

test('TC_AP_458 - Verify Checklist Add option creates a new row', async ({
  formBuilderPage,
}) => {
  await openOptionModal(formBuilderPage, 'checklist');
  await formBuilderPage.addOptionButton().click();
  await expect(formBuilderPage.optionLabelInputs()).toHaveCount(2);
  await expect(formBuilderPage.optionValueInputs()).toHaveCount(2);
});

test('TC_AP_459 - Verify Checklist Remove deletes only the selected option', async ({
  formBuilderPage,
}) => {
  await openOptionModal(formBuilderPage, 'checklist');
  await formBuilderPage.setOptions(orderedOptions);
  await formBuilderPage.removeOption(1);
  await formBuilderPage.expectOptionRows([orderedOptions[0], orderedOptions[2]]);
});

test('TC_AP_460 - Verify Checklist requires at least one option', async ({
  formBuilderPage,
}) => {
  await expectMinimumOptionRequired(formBuilderPage, 'checklist');
});

test('TC_AP_461 - Verify Checklist option character limits', async () => {
  test.skip(
    true,
    'Current frontend defines no maxlength for Checklist Option Label or Option Value inputs.',
  );
});

test('TC_AP_462 - Verify Checklist accepts special characters in options', async ({
  formBuilderPage,
}) => {
  const option = { label: 'R&D / QA ✅', value: 'r&d/qa#100%' };
  const label = await addOptionElement(
    formBuilderPage,
    'checklist',
    'Checklist-special',
    [option],
  );
  await expect(formBuilderPage.previewChecklistOption(label, option.label)).toBeVisible();
});

test('TC_AP_463 - Verify Checklist option order is preserved in preview', async ({
  formBuilderPage,
}) => {
  await expectPreviewOptionOrder(formBuilderPage, 'checklist', 'Checklist-order');
});

test('TC_AP_464 - Verify Checklist trims spaces in options', async () => {
  test.skip(
    true,
    'Current frontend trims leading Checklist option spaces only and preserves trailing spaces.',
  );
});

test('TC_AP_465 - Verify Checklist excludes incomplete option rows', async () => {
  test.skip(
    true,
    'Current frontend rejects incomplete Checklist option rows instead of excluding them.',
  );
});

test('TC_AP_466 - Verify Checklist supports adding options multiple times', async ({
  formBuilderPage,
}) => {
  await openOptionModal(formBuilderPage, 'checklist');
  await formBuilderPage.addOptionButton().click();
  await formBuilderPage.addOptionButton().click();
  await formBuilderPage.addOptionButton().click();
  await expect(formBuilderPage.optionLabelInputs()).toHaveCount(4);
});

test('TC_AP_467 - Verify closing an unsaved Checklist resets its data', async ({
  formBuilderPage,
}) => {
  await expectOptionCancel(formBuilderPage, 'checklist', 'Checklist-unsaved', true);
  await openOptionModal(formBuilderPage, 'checklist');
  await expect(formBuilderPage.fieldLabelInput()).toHaveValue('');
  await expect(formBuilderPage.optionLabelInputs().first()).toHaveValue('');
  await expect(formBuilderPage.optionValueInputs().first()).toHaveValue('');
});

test('TC_AP_468 - Verify Checklist large option list scrolling', async () => {
  test.skip(
    true,
    'Current frontend has no dedicated Checklist options-list scroll container or supported large-options scrolling contract.',
  );
});

test('TC_AP_469 - Verify added Checklist appears correctly in preview', async ({
  formBuilderPage,
}) => {
  await expectOptionPreview(formBuilderPage, 'checklist', 'Checklist-preview');
});

test('TC_AP_470 - Verify Radio modal opens on clicking the Add icon', async ({
  formBuilderPage,
}) => {
  await openOptionModal(formBuilderPage, 'radio');
});

test('TC_AP_471 - Verify Radio Field Label is mandatory', async ({ formBuilderPage }) => {
  await expectOptionFieldLabelRequired(formBuilderPage, 'radio', '');
});

test('TC_AP_472 - Verify Radio rejects spaces-only Field Label', async ({
  formBuilderPage,
}) => {
  await expectOptionFieldLabelRequired(formBuilderPage, 'radio', '   ');
});

test('TC_AP_473 - Verify Radio accepts a valid Field Label', async ({ formBuilderPage }) => {
  const label = await addOptionElement(formBuilderPage, 'radio', 'Radio-valid');
  await expect(formBuilderPage.previewField(label)).toBeVisible();
});

test('TC_AP_474 - Verify Radio Description accepts optional text', async () => {
  test.skip(
    true,
    'Current frontend Radio modal does not provide a Field Description input.',
  );
});

test('TC_AP_475 - Verify Radio Description can be left empty', async () => {
  test.skip(
    true,
    'Current frontend Radio modal does not provide a Field Description input to validate as optional.',
  );
});

test('TC_AP_476 - Verify Radio Required checkbox functionality', async ({
  formBuilderPage,
}) => {
  await expectOptionRequiredState(formBuilderPage, 'radio', true, 'Radio-required');
});

test('TC_AP_477 - Verify unchecked Radio Required behavior', async ({
  formBuilderPage,
}) => {
  await expectOptionRequiredState(formBuilderPage, 'radio', false, 'Radio-optional');
});

test('TC_AP_478 - Verify Radio Cancel closes without saving', async ({
  formBuilderPage,
}) => {
  await expectOptionCancel(formBuilderPage, 'radio', 'Radio-cancel');
});

test('TC_AP_479 - Verify Radio Close icon closes without saving', async ({
  formBuilderPage,
}) => {
  await expectOptionCancel(formBuilderPage, 'radio', 'Radio-close', true);
});

test('TC_AP_480 - Verify Radio modal resets when reopened', async ({
  formBuilderPage,
}) => {
  await expectOptionModalReset(formBuilderPage, 'radio', 'Radio-reset');
});

test('TC_AP_481 - Verify Radio Field Label maximum character limit', async ({
  formBuilderPage,
}) => {
  await expectOptionLabelLimit(formBuilderPage, 'radio');
});

test('TC_AP_483 - Verify Radio modal layout and controls', async ({
  formBuilderPage,
}) => {
  await openOptionModal(formBuilderPage, 'radio');
  await expect(formBuilderPage.elementModalTitle()).toContainText('Radio buttons');
  await expect(formBuilderPage.addOptionButton()).toBeVisible();
  await expect(formBuilderPage.modalRequiredCheckbox()).toHaveCount(1);
  await expect(formBuilderPage.modalRequiredCheckbox()).toBeVisible();
  await expect(formBuilderPage.addFieldButton()).toBeVisible();
  await expect(formBuilderPage.cancelElementButton()).toBeVisible();
});

test('TC_AP_484 - Verify Radio default number of option rows', async ({
  formBuilderPage,
}) => {
  await openOptionModal(formBuilderPage, 'radio');
  await expect(formBuilderPage.optionLabelInputs()).toHaveCount(
    FormsData.builder.limits.initialOptionRows,
  );
});

test('TC_AP_485 - Verify Radio Option Label and Value are mandatory', async ({
  formBuilderPage,
}) => {
  await expectOptionValuesRequired(formBuilderPage, 'radio');
});

test('TC_AP_486 - Verify Radio rejects spaces-only option fields', async ({
  formBuilderPage,
}) => {
  await expectOptionValuesRequired(formBuilderPage, 'radio', true);
});

test('TC_AP_487 - Verify Radio Add option creates a new row', async ({
  formBuilderPage,
}) => {
  await openOptionModal(formBuilderPage, 'radio');
  await formBuilderPage.addOptionButton().click();
  await expect(formBuilderPage.optionLabelInputs()).toHaveCount(2);
  await expect(formBuilderPage.optionValueInputs()).toHaveCount(2);
});

test('TC_AP_488 - Verify Radio Remove deletes only the selected option', async ({
  formBuilderPage,
}) => {
  await openOptionModal(formBuilderPage, 'radio');
  await formBuilderPage.setOptions(orderedOptions);
  await formBuilderPage.removeOption(1);
  await formBuilderPage.expectOptionRows([orderedOptions[0], orderedOptions[2]]);
});

test('TC_AP_489 - Verify Radio requires at least one option', async ({
  formBuilderPage,
}) => {
  await expectMinimumOptionRequired(formBuilderPage, 'radio');
});

test('TC_AP_490 - Verify Radio option character limits', async () => {
  test.skip(
    true,
    'Current frontend defines no maxlength for Radio Option Label or Option Value inputs.',
  );
});

test('TC_AP_491 - Verify Radio accepts special characters in options', async ({
  formBuilderPage,
}) => {
  const option = { label: 'R&D / QA ✅', value: 'r&d/qa#100%' };
  const label = await addOptionElement(formBuilderPage, 'radio', 'Radio-special', [
    option,
  ]);
  await expect(formBuilderPage.previewRadioOption(label, option.label)).toBeVisible();
});

test('TC_AP_492 - Verify Radio option order is preserved in preview', async ({
  formBuilderPage,
}) => {
  await expectPreviewOptionOrder(formBuilderPage, 'radio', 'Radio-order');
});

test('TC_AP_493 - Verify Radio trims spaces in options', async () => {
  test.skip(
    true,
    'Current frontend trims leading Radio option spaces only and preserves trailing spaces.',
  );
});

test('TC_AP_494 - Verify Radio excludes incomplete option rows', async () => {
  test.skip(
    true,
    'Current frontend rejects incomplete Radio option rows instead of excluding them.',
  );
});

test('TC_AP_495 - Verify Radio supports adding options multiple times', async ({
  formBuilderPage,
}) => {
  await openOptionModal(formBuilderPage, 'radio');
  await formBuilderPage.addOptionButton().click();
  await formBuilderPage.addOptionButton().click();
  await formBuilderPage.addOptionButton().click();
  await expect(formBuilderPage.optionLabelInputs()).toHaveCount(4);
});

test('TC_AP_496 - Verify closing an unsaved Radio resets its data', async ({
  formBuilderPage,
}) => {
  await expectOptionCancel(formBuilderPage, 'radio', 'Radio-unsaved', true);
  await openOptionModal(formBuilderPage, 'radio');
  await expect(formBuilderPage.fieldLabelInput()).toHaveValue('');
  await expect(formBuilderPage.optionLabelInputs().first()).toHaveValue('');
  await expect(formBuilderPage.optionValueInputs().first()).toHaveValue('');
});

test('TC_AP_497 - Verify Radio large option list scrolling', async () => {
  test.skip(
    true,
    'Current frontend has no dedicated Radio options-list scroll container or supported large-options scrolling contract.',
  );
});

test('TC_AP_498 - Verify added Radio appears correctly in preview', async ({
  formBuilderPage,
}) => {
  await expectOptionPreview(formBuilderPage, 'radio', 'Radio-preview');
});

test('TC_AP_499 - Verify Numeric Slider modal opens on clicking the Add icon', async ({
  formBuilderPage,
}) => {
  await openSliderModal(formBuilderPage);
  await expect(formBuilderPage.elementModalTitle()).toContainText('Numeric slider');
});

test('TC_AP_500 - Verify Numeric Slider Field Label is mandatory', async ({
  formBuilderPage,
}) => {
  await openSliderModal(formBuilderPage);
  await formBuilderPage.addFieldButton().click();
  await formBuilderPage.expectValidationMessage(FormsData.builder.errors.labelRequired);
});

test('TC_AP_501 - Verify Numeric Slider rejects spaces-only Field Label', async ({
  formBuilderPage,
}) => {
  await openSliderModal(formBuilderPage);
  await formBuilderPage.fieldLabelInput().fill('   ');
  await formBuilderPage.addFieldButton().click();
  await formBuilderPage.expectValidationMessage(FormsData.builder.errors.labelRequired);
});

test('TC_AP_502 - Verify Numeric Slider accepts a valid Field Label', async ({
  formBuilderPage,
}) => {
  const label = await addSlider(formBuilderPage, 'Slider-valid');
  await expect(formBuilderPage.previewSlider(label)).toBeVisible();
});

test('TC_AP_503 - Verify Numeric Slider Required checkbox functionality', async ({
  formBuilderPage,
}) => {
  const label = await addSlider(formBuilderPage, 'Slider-required', { required: true });
  await expect(formBuilderPage.previewRequiredCheckbox(label)).toBeChecked();
});

test('TC_AP_504 - Verify unchecked Numeric Slider Required behavior', async ({
  formBuilderPage,
}) => {
  const label = await addSlider(formBuilderPage, 'Slider-optional', { required: false });
  await expect(formBuilderPage.previewRequiredCheckbox(label)).not.toBeChecked();
});

test('TC_AP_505 - Verify Numeric Slider Cancel closes without saving', async ({
  formBuilderPage,
}) => {
  const label = uniqueLabel('Slider-cancel');
  await openSliderModal(formBuilderPage);
  await formBuilderPage.fieldLabelInput().fill(label);
  await formBuilderPage.cancelElementModal();
  await expect(formBuilderPage.previewField(label)).toHaveCount(0);
});

test('TC_AP_506 - Verify Numeric Slider Close icon closes without saving', async ({
  formBuilderPage,
}) => {
  const label = uniqueLabel('Slider-close');
  await openSliderModal(formBuilderPage);
  await formBuilderPage.fieldLabelInput().fill(label);
  await formBuilderPage.elementModal().getByRole('button', { name: 'Close' }).click();
  await expect(formBuilderPage.elementModal()).toBeHidden();
  await expect(formBuilderPage.previewField(label)).toHaveCount(0);
});

test('TC_AP_507 - Verify Numeric Slider modal resets when reopened', async ({
  formBuilderPage,
}) => {
  await openSliderModal(formBuilderPage);
  await formBuilderPage.fillElementModal({
    label: uniqueLabel('Slider-reset'),
    min: 10,
    max: 80,
    step: 5,
    required: true,
  });
  await formBuilderPage.cancelElementModal();
  await openSliderModal(formBuilderPage);
  await expect(formBuilderPage.fieldLabelInput()).toHaveValue('');
  await expect(formBuilderPage.modalRequiredCheckbox()).not.toBeChecked();
  await expectSliderDefaults(formBuilderPage);
});

test('TC_AP_508 - Verify Numeric Slider Field Label maximum character limit', async ({
  formBuilderPage,
}) => {
  await openSliderModal(formBuilderPage);
  const input = formBuilderPage.fieldLabelInput();
  await expect(input).toHaveAttribute('maxlength', String(FormsData.builder.limits.fieldLabel));
  await input.fill('L'.repeat(FormsData.builder.limits.fieldLabel + 10));
  await expect(input).toHaveValue('L'.repeat(FormsData.builder.limits.fieldLabel));
});

test('TC_AP_510 - Verify Numeric Slider modal layout and controls', async ({
  formBuilderPage,
}) => {
  await openSliderModal(formBuilderPage);
  await expect(formBuilderPage.elementModalTitle()).toContainText('Numeric slider');
  await expect(formBuilderPage.fieldLabelInput()).toBeVisible();
  await expect(formBuilderPage.modalRequiredCheckbox()).toBeVisible();
  await expect(formBuilderPage.sliderMinimumInput()).toBeVisible();
  await expect(formBuilderPage.sliderMaximumInput()).toBeVisible();
  await expect(formBuilderPage.sliderStepInput()).toBeVisible();
  await expect(formBuilderPage.addFieldButton()).toBeVisible();
  await expect(formBuilderPage.cancelElementButton()).toBeVisible();
});

test('TC_AP_511 - Verify Numeric Slider defaults are 0, 100, and 1', async ({
  formBuilderPage,
}) => {
  await openSliderModal(formBuilderPage);
  await expectSliderDefaults(formBuilderPage);
});

test('TC_AP_512 - Verify Numeric Slider Minimum value is mandatory', async ({
  formBuilderPage,
}) => {
  await openSliderModal(formBuilderPage);
  await expectSliderValidation(
    formBuilderPage,
    formBuilderPage.sliderMinimumInput(),
    '',
    FormsData.builder.errors.minimumValueRequired,
  );
});

test('TC_AP_513 - Verify Numeric Slider Maximum value is mandatory', async ({
  formBuilderPage,
}) => {
  await openSliderModal(formBuilderPage);
  await expectSliderValidation(
    formBuilderPage,
    formBuilderPage.sliderMaximumInput(),
    '',
    FormsData.builder.errors.maximumValueRequired,
  );
});

test('TC_AP_514 - Verify Numeric Slider Step value is mandatory', async ({
  formBuilderPage,
}) => {
  await openSliderModal(formBuilderPage);
  await expectSliderValidation(
    formBuilderPage,
    formBuilderPage.sliderStepInput(),
    '',
    FormsData.builder.errors.stepValueRequired,
  );
});

test('TC_AP_515 - Verify Numeric Slider Minimum sanitizes nonnumeric input', async ({
  formBuilderPage,
}) => {
  await openSliderModal(formBuilderPage);
  const input = formBuilderPage.sliderMinimumInput();
  await input.fill('not-a-number');
  await formBuilderPage.fieldLabelInput().fill(uniqueLabel('Slider-min-number'));
  await formBuilderPage.addFieldButton().click();
  await expect(input).toHaveValue('');
  await expect(formBuilderPage.elementModal()).toBeVisible();
});

test('TC_AP_516 - Verify Numeric Slider Maximum sanitizes nonnumeric input', async ({
  formBuilderPage,
}) => {
  await openSliderModal(formBuilderPage);
  const input = formBuilderPage.sliderMaximumInput();
  await input.fill('not-a-number');
  await formBuilderPage.fieldLabelInput().fill(uniqueLabel('Slider-max-number'));
  await formBuilderPage.addFieldButton().click();
  await expect(input).toHaveValue('');
  await expect(formBuilderPage.elementModal()).toBeVisible();
});

test('TC_AP_517 - Verify Numeric Slider Step sanitizes nonnumeric input', async ({
  formBuilderPage,
}) => {
  await openSliderModal(formBuilderPage);
  const input = formBuilderPage.sliderStepInput();
  await input.fill('not-a-number');
  await formBuilderPage.fieldLabelInput().fill(uniqueLabel('Slider-step-number'));
  await formBuilderPage.addFieldButton().click();
  expect(Number(await input.inputValue())).toBe(FormsData.builder.defaults.slider.step);
  await expect(formBuilderPage.elementModal()).toBeVisible();
});

test('TC_AP_518 - Verify Numeric Slider Minimum cannot exceed Maximum', async ({
  formBuilderPage,
}) => {
  await openSliderModal(formBuilderPage);
  await formBuilderPage.fillElementModal({
    label: uniqueLabel('Slider-min-exceeds-max'),
    min: 90,
    max: 80,
    step: 1,
  });
  await formBuilderPage.addFieldButton().click();
  await formBuilderPage.expectValidationMessage(FormsData.builder.errors.sliderMinLessThanMax);
  await expect(formBuilderPage.elementModal()).toBeVisible();
});

test('TC_AP_519 - Verify Numeric Slider Maximum must be greater than Minimum', async ({
  formBuilderPage,
}) => {
  await openSliderModal(formBuilderPage);
  await formBuilderPage.fillElementModal({
    label: uniqueLabel('Slider-max-greater'),
    min: 50,
    max: 50,
    step: 1,
  });
  await formBuilderPage.addFieldButton().click();
  await formBuilderPage.expectValidationMessage(FormsData.builder.errors.sliderMinLessThanMax);
  await expect(formBuilderPage.elementModal()).toBeVisible();
});

test('TC_AP_520 - Verify Numeric Slider Step must be at least 0.1', async ({
  formBuilderPage,
}) => {
  const label = await addSlider(formBuilderPage, 'Slider-positive-step', {
    min: 0,
    max: 100,
    step: 0,
  });
  await expect(formBuilderPage.previewField(label)).toContainText('step 0.1');
});

test('TC_AP_521 - Verify Numeric Slider Step does not exceed Maximum minus Minimum', async () => {
  test.skip(
    true,
    'Current frontend validates Step only within 0.1..100 and does not enforce Step <= Maximum - Minimum.',
  );
});

test('TC_AP_522 - Verify Numeric Slider supports decimal values', async ({
  formBuilderPage,
}) => {
  const label = await addSlider(formBuilderPage, 'Slider-decimal-step', {
    min: 0.5,
    max: 10.5,
    step: 0.5,
  });
  const slider = formBuilderPage.previewSlider(label);
  await expect(slider).toHaveAttribute('aria-valuemin', '0.5');
  await expect(slider).toHaveAttribute('aria-valuemax', '10.5');
  await expect(formBuilderPage.previewField(label)).toContainText(
    '0.5 to 10.5 (step 0.5)',
  );
});

test('TC_AP_523 - Verify Numeric Slider supports negative values', async () => {
  test.skip(
    true,
    'Current frontend restricts Numeric Slider Minimum and Maximum to the 0..100 range, so negative values conflict with validation.',
  );
});

test('TC_AP_524 - Verify Numeric Slider rejects very large values with max validation', async ({
  formBuilderPage,
}) => {
  await openSliderModal(formBuilderPage);
  await expectSliderValidation(
    formBuilderPage,
    formBuilderPage.sliderMaximumInput(),
    '999999999999',
    FormsData.builder.errors.maximumValueAboveMaximum,
  );
});

test('TC_AP_525 - Verify Numeric Slider trims spaces in options', async () => {
  test.skip(
    true,
    'Numeric Slider has no option rows, so option-space trimming is not applicable to this field type.',
  );
});

test('TC_AP_526 - Verify Numeric Slider sanitizes special characters', async ({
  formBuilderPage,
}) => {
  await openSliderModal(formBuilderPage);
  const input = formBuilderPage.sliderMinimumInput();
  await input.fill('@#$%^&*');
  await formBuilderPage.fieldLabelInput().fill(uniqueLabel('Slider-special'));
  await formBuilderPage.addFieldButton().click();
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(formBuilderPage.elementModal()).toBeVisible();
});

test('TC_AP_527 - Verify Numeric Slider supports decimal Minimum and Maximum', async ({
  formBuilderPage,
}) => {
  const label = await addSlider(formBuilderPage, 'Slider-decimal-range', {
    min: 0.1,
    max: 99.9,
    step: 0.1,
  });
  const slider = formBuilderPage.previewSlider(label);
  await expect(slider).toHaveAttribute('aria-valuemin', '0.1');
  await expect(slider).toHaveAttribute('aria-valuemax', '99.9');
  await expect(formBuilderPage.previewField(label)).toContainText(
    '0.1 to 99.9 (step 0.1)',
  );
});

test('TC_AP_528 - Verify Numeric Slider Cancel restores initial values', async ({
  formBuilderPage,
}) => {
  const existingLabel = await addSlider(formBuilderPage, 'Slider-existing', {
    min: 10,
    max: 90,
    step: 5,
  });
  const existingSlider = formBuilderPage.previewSlider(existingLabel);
  await expect(existingSlider).toHaveAttribute('aria-valuemin', '10');
  await expect(existingSlider).toHaveAttribute('aria-valuemax', '90');

  const cancelledLabel = uniqueLabel('Slider-cancelled');
  await openSliderModal(formBuilderPage);
  await formBuilderPage.fillElementModal({
    label: cancelledLabel,
    min: 20,
    max: 80,
    step: 10,
  });
  await formBuilderPage.cancelElementModal();
  await expect(formBuilderPage.previewField(cancelledLabel)).toHaveCount(0);
  await expect(existingSlider).toHaveAttribute('aria-valuemin', '10');
  await expect(existingSlider).toHaveAttribute('aria-valuemax', '90');

  await openSliderModal(formBuilderPage);
  await expectSliderDefaults(formBuilderPage);
});

test('TC_AP_529 - Verify configured Numeric Slider appears correctly in preview', async ({
  formBuilderPage,
}) => {
  const label = await addSlider(formBuilderPage, 'Slider-preview', {
    min: 10,
    max: 90,
    step: 5,
  });
  const slider = formBuilderPage.previewSlider(label);
  await expect(slider).toBeVisible();
  await expect(slider).toHaveAttribute('aria-valuemin', '10');
  await expect(slider).toHaveAttribute('aria-valuemax', '90');
  await expect(slider).toHaveAttribute('aria-valuenow', '10');
  await expect(formBuilderPage.previewField(label)).toContainText(
    '10 to 90 (step 5)',
  );
});

test('TC_AP_530 - Verify Star Rating modal opens on clicking the Add icon', async ({
  formBuilderPage,
}) => {
  await openRatingModal(formBuilderPage);
  await expect(formBuilderPage.elementModalTitle()).toContainText('Star rating');
});

test('TC_AP_531 - Verify Star Rating Field Label is mandatory', async ({
  formBuilderPage,
}) => {
  await openRatingModal(formBuilderPage);
  await formBuilderPage.addFieldButton().click();
  await formBuilderPage.expectValidationMessage(FormsData.builder.errors.labelRequired);
});

test('TC_AP_532 - Verify Star Rating rejects spaces-only Field Label', async ({
  formBuilderPage,
}) => {
  await openRatingModal(formBuilderPage);
  await formBuilderPage.fieldLabelInput().fill('   ');
  await formBuilderPage.addFieldButton().click();
  await formBuilderPage.expectValidationMessage(FormsData.builder.errors.labelRequired);
});

test('TC_AP_533 - Verify Star Rating accepts a valid Field Label', async ({
  formBuilderPage,
}) => {
  const label = await addRating(formBuilderPage, 'Rating-valid');
  await expect(formBuilderPage.previewRatingStars(label)).toHaveCount(
    FormsData.builder.defaults.rating.maxRating,
  );
});

test('TC_AP_534 - Verify Star Rating Required checkbox functionality', async ({
  formBuilderPage,
}) => {
  const label = await addRating(
    formBuilderPage,
    'Rating-required',
    FormsData.builder.defaults.rating.maxRating,
    true,
  );
  await expect(formBuilderPage.previewRequiredCheckbox(label)).toBeChecked();
});

test('TC_AP_535 - Verify unchecked Star Rating Required behavior', async ({
  formBuilderPage,
}) => {
  const label = await addRating(
    formBuilderPage,
    'Rating-optional',
    FormsData.builder.defaults.rating.maxRating,
    false,
  );
  await expect(formBuilderPage.previewRequiredCheckbox(label)).not.toBeChecked();
});

test('TC_AP_536 - Verify Star Rating Cancel closes without saving', async ({
  formBuilderPage,
}) => {
  const label = uniqueLabel('Rating-cancel');
  await openRatingModal(formBuilderPage);
  await formBuilderPage.fieldLabelInput().fill(label);
  await formBuilderPage.cancelElementModal();
  await expect(formBuilderPage.previewField(label)).toHaveCount(0);
});

test('TC_AP_537 - Verify Star Rating Close icon closes without saving', async ({
  formBuilderPage,
}) => {
  const label = uniqueLabel('Rating-close');
  await openRatingModal(formBuilderPage);
  await formBuilderPage.fieldLabelInput().fill(label);
  await formBuilderPage.elementModal().getByRole('button', { name: 'Close' }).click();
  await expect(formBuilderPage.elementModal()).toBeHidden();
  await expect(formBuilderPage.previewField(label)).toHaveCount(0);
});

test('TC_AP_538 - Verify Star Rating modal resets when reopened', async ({
  formBuilderPage,
}) => {
  await openRatingModal(formBuilderPage);
  await formBuilderPage.fillElementModal({
    label: uniqueLabel('Rating-reset'),
    maxRating: 8,
    required: true,
  });
  await formBuilderPage.cancelElementModal();
  await openRatingModal(formBuilderPage);
  await expect(formBuilderPage.fieldLabelInput()).toHaveValue('');
  await expect(formBuilderPage.modalRequiredCheckbox()).not.toBeChecked();
  await expect(formBuilderPage.ratingStarCountInput()).toHaveValue(
    String(FormsData.builder.defaults.rating.maxRating),
  );
});

test('TC_AP_539 - Verify Star Rating Field Label maximum character limit', async ({
  formBuilderPage,
}) => {
  await openRatingModal(formBuilderPage);
  const input = formBuilderPage.fieldLabelInput();
  await expect(input).toHaveAttribute('maxlength', String(FormsData.builder.limits.fieldLabel));
  await input.fill('L'.repeat(FormsData.builder.limits.fieldLabel + 10));
  await expect(input).toHaveValue('L'.repeat(FormsData.builder.limits.fieldLabel));
});

test('TC_AP_541 - Verify Star Rating modal layout and controls', async ({
  formBuilderPage,
}) => {
  await openRatingModal(formBuilderPage);
  const input = formBuilderPage.ratingStarCountInput();
  await expect(formBuilderPage.elementModalTitle()).toContainText('Star rating');
  await expect(formBuilderPage.fieldLabelInput()).toBeVisible();
  await expect(formBuilderPage.modalRequiredCheckbox()).toBeVisible();
  await expect(input).toBeVisible();
  await expect(input).toHaveValue(String(FormsData.builder.defaults.rating.maxRating));
  await expect(input).toHaveAttribute(
    'aria-valuemin',
    String(FormsData.builder.limits.ratingMinimum),
  );
  await expect(formBuilderPage.addFieldButton()).toBeVisible();
  await expect(formBuilderPage.cancelElementButton()).toBeVisible();
});

test('TC_AP_542 - Verify Star Rating star count is mandatory when cleared', async ({
  formBuilderPage,
}) => {
  await openRatingModal(formBuilderPage);
  await formBuilderPage.fieldLabelInput().fill(uniqueLabel('Rating-mandatory'));
  await formBuilderPage.ratingStarCountInput().fill('');
  await formBuilderPage.addFieldButton().click();
  await formBuilderPage.expectValidationMessage(FormsData.builder.errors.starsRequired);
  await expect(formBuilderPage.elementModal()).toBeVisible();
});

test('TC_AP_543 - Verify Star Rating InputNumber arrow controls and keyboard', async ({
  formBuilderPage,
}) => {
  await openRatingModal(formBuilderPage);
  const input = formBuilderPage.ratingStarCountInput();
  const inputNumber = input.locator(
    'xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " ant-input-number ")][1]',
  );
  await inputNumber.locator('.ant-input-number-handler-up').click();
  await expect(input).toHaveValue('6');
  await input.press('ArrowDown');
  await expect(input).toHaveValue('5');
  await input.press('ArrowUp');
  await expect(input).toHaveValue('6');
  await inputNumber.locator('.ant-input-number-handler-down').click();
  await expect(input).toHaveValue('5');
});

test('TC_AP_544 - Verify configured Star Rating preview is disabled with correct count', async ({
  formBuilderPage,
}) => {
  const count = 8;
  const label = await addRating(formBuilderPage, 'Rating-preview', count);
  const rating = formBuilderPage.previewRating(label);
  await expect(rating).toBeVisible();
  await expect(rating).toHaveClass(/ant-rate-disabled/);
  await expect(formBuilderPage.previewRatingStars(label)).toHaveCount(count);
});
