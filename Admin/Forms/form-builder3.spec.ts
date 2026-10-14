import { test, expect } from "../fixtures/forms.fixture";
import {
  FormsData,
  type FormBuilderElementType,
  uniqueFormBuilderData,
} from "../data/FormsData";
import type {
  AddFormElementOptions,
  FormBuilderImageOption,
  FormBuilderPage,
} from "../pages/FormBuilderPage";

type ImageElementType = Extract<
  FormBuilderElementType,
  "imageChecklist" | "imageRadio"
>;
type SimpleElementType = Extract<
  FormBuilderElementType,
  "imageUpload" | "fileUpload" | "date" | "time"
>;

const pngBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl9sAAAAASUVORK5CYII=",
  "base64",
);

function imagePayload(
  name = "valid-image.png",
  size = 2 * 1024,
  mimeType = "image/png",
): NonNullable<FormBuilderImageOption["file"]> {
  return {
    name,
    mimeType,
    buffer:
      size > pngBytes.length
        ? Buffer.concat([pngBytes, Buffer.alloc(size - pngBytes.length)])
        : pngBytes.subarray(0, size),
  };
}

const validImage = imagePayload();
const replacementImage = imagePayload(
  "replacement-image.jpg",
  3 * 1024,
  "image/jpeg",
);
const unsupportedPdf = {
  name: "unsupported.pdf",
  mimeType: "application/pdf",
  buffer: Buffer.from("%PDF-1.4 unsupported image option"),
};
const undersizeImage = imagePayload("undersize.png", pngBytes.length);
const oversizeImage = imagePayload(
  "oversize.jpeg",
  FormsData.builder.limits.imageMaximumBytes + 1,
  "image/jpeg",
);

function uniqueLabel(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`.slice(
    0,
    FormsData.builder.limits.fieldLabel,
  );
}

function imageOption(
  label = "Image option",
  file = validImage,
): FormBuilderImageOption {
  return { label, file };
}

async function openImageModal(
  formBuilderPage: FormBuilderPage,
  type: ImageElementType,
) {
  await formBuilderPage.openElementModal(type);
  await formBuilderPage.expectElementModal(type);
}

async function addImageElement(
  formBuilderPage: FormBuilderPage,
  type: ImageElementType,
  prefix: string,
  required = false,
) {
  const label = uniqueLabel(prefix);
  await formBuilderPage.addElement(type, {
    label,
    required,
    imageOptions: [imageOption()],
  });
  return label;
}

type ImageCaseAction =
  | "open"
  | "mandatory"
  | "spaces"
  | "valid"
  | "required"
  | "unchecked"
  | "cancel"
  | "close"
  | "reset"
  | "labelLimit"
  | "special"
  | "layout"
  | "loads"
  | "uploadClickable"
  | "formats"
  | "unsupported"
  | "maximum"
  | "minimum"
  | "uploadPreview"
  | "replace"
  | "multiple"
  | "missing"
  | "fieldPreview";

async function runImageCase(
  formBuilderPage: FormBuilderPage,
  type: ImageElementType,
  action: ImageCaseAction,
) {
  const prefix = type === "imageChecklist" ? "image-checklist" : "image-radio";

  if (action === "open") {
    await openImageModal(formBuilderPage, type);
    return;
  }
  if (action === "mandatory" || action === "spaces") {
    await openImageModal(formBuilderPage, type);
    if (action === "spaces")
      await formBuilderPage.fieldLabelInput().fill("   ");
    await formBuilderPage.setImageOption(0, imageOption());
    await formBuilderPage.addFieldButton().click();
    await formBuilderPage.expectValidationMessage(
      FormsData.builder.errors.labelRequired,
    );
    return;
  }
  if (action === "valid") {
    await addImageElement(formBuilderPage, type, `${prefix}-valid`);
    return;
  }
  if (action === "required" || action === "unchecked") {
    const required = action === "required";
    const label = await addImageElement(
      formBuilderPage,
      type,
      `${prefix}-required`,
      required,
    );
    await expect(formBuilderPage.previewRequiredCheckbox(label)).toBeChecked({
      checked: required,
    });
    return;
  }
  if (action === "cancel" || action === "close") {
    const label = uniqueLabel(`${prefix}-cancel`);
    await openImageModal(formBuilderPage, type);
    await formBuilderPage.fillElementModal({
      label,
      imageOptions: [imageOption()],
    });
    if (action === "close") {
      await formBuilderPage
        .elementModal()
        .getByRole("button", { name: "Close" })
        .click();
      await expect(formBuilderPage.elementModal()).toBeHidden();
    } else {
      await formBuilderPage.cancelElementModal();
    }
    await expect(formBuilderPage.previewField(label)).toHaveCount(0);
    return;
  }
  if (action === "reset") {
    await openImageModal(formBuilderPage, type);
    await formBuilderPage.fillElementModal({
      label: uniqueLabel(`${prefix}-reset`),
      required: true,
      imageOptions: [imageOption()],
    });
    await expect(formBuilderPage.modalImagePreviews()).toHaveCount(1);
    await formBuilderPage.cancelElementModal();
    await openImageModal(formBuilderPage, type);
    await expect(formBuilderPage.fieldLabelInput()).toHaveValue("");
    await expect(formBuilderPage.modalRequiredCheckbox()).not.toBeChecked();
    await expect(formBuilderPage.optionLabelInputs()).toHaveCount(1);
    await expect(formBuilderPage.optionLabelInputs()).toHaveValue("");
    await expect(formBuilderPage.modalImagePreviews()).toHaveCount(0);
    return;
  }
  if (action === "labelLimit") {
    await openImageModal(formBuilderPage, type);
    await expect(formBuilderPage.fieldLabelInput()).toHaveAttribute(
      "maxlength",
      String(FormsData.builder.limits.fieldLabel),
    );
    await formBuilderPage
      .fieldLabelInput()
      .fill("L".repeat(FormsData.builder.limits.fieldLabel + 10));
    await expect(formBuilderPage.fieldLabelInput()).toHaveValue(
      "L".repeat(FormsData.builder.limits.fieldLabel),
    );
    return;
  }
  if (action === "special") {
    const label = uniqueLabel(`${prefix}-!@#$%`);
    await formBuilderPage.addElement(type, {
      label,
      imageOptions: [imageOption("Option !@#$%")],
    });
    await expect(formBuilderPage.previewField(label)).toBeVisible();
    return;
  }
  if (action === "layout" || action === "loads") {
    await openImageModal(formBuilderPage, type);
    await expect(formBuilderPage.fieldLabelInput()).toBeVisible();
    await expect(formBuilderPage.optionLabelInputs()).toHaveCount(1);
    await expect(formBuilderPage.imageUploadButton(0)).toBeVisible();
    await expect(formBuilderPage.optionRemoveButton(0)).toBeVisible();
    await expect(formBuilderPage.addOptionButton()).toBeVisible();
    await expect(formBuilderPage.modalRequiredCheckbox()).toBeVisible();
    await expect(formBuilderPage.addFieldButton()).toBeVisible();
    await expect(formBuilderPage.cancelElementButton()).toBeVisible();
    return;
  }
  if (action === "uploadClickable") {
    await openImageModal(formBuilderPage, type);
    const chooser = formBuilderPage.page.waitForEvent("filechooser");
    await formBuilderPage.imageUploadButton(0).click();
    await (await chooser).setFiles(validImage);
    await expect(formBuilderPage.modalImagePreviews()).toHaveCount(1);
    return;
  }
  if (action === "formats") {
    await openImageModal(formBuilderPage, type);
    for (const [name, mimeType] of [
      ["supported.jpg", "image/jpeg"],
      ["supported.jpeg", "image/jpeg"],
      ["supported.png", "image/png"],
    ] as const) {
      await formBuilderPage.uploadOptionImage(
        0,
        imagePayload(name, 2 * 1024, mimeType),
      );
      await expect(formBuilderPage.modalImagePreviews()).toHaveCount(1);
      await expect(
        formBuilderPage.modalImagePreviews().first(),
      ).toHaveJSProperty("naturalWidth", 1);
    }
    return;
  }
  if (
    action === "unsupported" ||
    action === "maximum" ||
    action === "minimum"
  ) {
    await openImageModal(formBuilderPage, type);
    const payload =
      action === "unsupported"
        ? unsupportedPdf
        : action === "maximum"
          ? oversizeImage
          : undersizeImage;
    await formBuilderPage.imageUploadInputs().first().setInputFiles(payload);
    const message =
      action === "unsupported"
        ? FormsData.builder.errors.unsupportedImage
        : action === "maximum"
          ? FormsData.builder.errors.imageAboveMaximum
          : FormsData.builder.errors.imageBelowMinimum;
    await expect(formBuilderPage.toast(message)).toBeVisible();
    await expect(formBuilderPage.modalImagePreviews()).toHaveCount(0);
    return;
  }
  if (action === "uploadPreview") {
    await openImageModal(formBuilderPage, type);
    await formBuilderPage.uploadOptionImage(0, validImage);
    await expect(formBuilderPage.modalImagePreviews()).toHaveCount(1);
    await expect(formBuilderPage.modalImagePreviews().first()).toHaveJSProperty(
      "naturalWidth",
      1,
    );
    return;
  }
  if (action === "replace") {
    await openImageModal(formBuilderPage, type);
    await formBuilderPage.uploadOptionImage(0, validImage);
    const originalSource = await formBuilderPage
      .modalImagePreviews()
      .first()
      .getAttribute("src");
    await formBuilderPage.uploadOptionImage(0, replacementImage);
    await expect(formBuilderPage.modalImagePreviews()).toHaveCount(1);
    await expect(
      formBuilderPage.modalImagePreviews().first(),
    ).not.toHaveAttribute("src", originalSource ?? "");
    return;
  }
  if (action === "multiple") {
    await openImageModal(formBuilderPage, type);
    await formBuilderPage.setImageOptions([
      imageOption("First image", validImage),
      imageOption("Second image", replacementImage),
    ]);
    await expect(formBuilderPage.modalImagePreviews()).toHaveCount(2);
    const sources = await formBuilderPage
      .modalImagePreviews()
      .evaluateAll((images) =>
        images.map((image) => image.getAttribute("src")),
      );
    expect(new Set(sources).size).toBe(2);
    return;
  }
  if (action === "missing") {
    await openImageModal(formBuilderPage, type);
    await formBuilderPage
      .fieldLabelInput()
      .fill(uniqueLabel(`${prefix}-missing`));
    await formBuilderPage.optionLabelInputs().first().fill("Missing image");
    await formBuilderPage.addFieldButton().click();
    await formBuilderPage.expectValidationMessage(
      FormsData.builder.errors.imageOptionRequired,
    );
    await expect(formBuilderPage.elementModal()).toBeVisible();
    return;
  }

  const label = await addImageElement(
    formBuilderPage,
    type,
    `${prefix}-preview`,
  );
  await expect(
    formBuilderPage.previewOptionImage(label, "Image option"),
  ).toBeVisible();
  await expect(
    formBuilderPage.previewOptionImage(label, "Image option"),
  ).toHaveJSProperty("naturalWidth", 1);
  const option =
    type === "imageChecklist"
      ? formBuilderPage.previewChecklistOption(label, "Image option")
      : formBuilderPage.previewRadioOption(label, "Image option");
  await expect(option).toBeVisible();
}

const imageChecklistCases: Array<[string, string, ImageCaseAction]> = [
  [
    "TC_AP_545",
    "Verify Checklist with image modal opens on clicking the “+” icon",
    "open",
  ],
  ["TC_AP_546", "Verify Field Label is mandatory", "mandatory"],
  [
    "TC_AP_547",
    "Verify validation when entering only spaces in Field Label",
    "spaces",
  ],
  ["TC_AP_548", "Verify valid Field Label is accepted", "valid"],
  ["TC_AP_549", "Verify Required checkbox functionality", "required"],
  ["TC_AP_550", "Verify unchecked Required checkbox behavior", "unchecked"],
  [
    "TC_AP_551",
    "Verify Cancel button closes the modal without saving",
    "cancel",
  ],
  ["TC_AP_552", "Verify Close (X) icon closes modal", "close"],
  ["TC_AP_553", "Verify modal resets when reopened", "reset"],
  ["TC_AP_554", "Verify maximum character limit for Field Label", "labelLimit"],
  ["TC_AP_555", "Verify special characters in Field Label", "special"],
  ["TC_AP_556", "Verify modal layout/UI elements", "layout"],
  [
    "TC_AP_557",
    "Verify checklist loads properly with image-upload options",
    "loads",
  ],
  [
    "TC_AP_558",
    "Verify upload button is clickable for each checklist option",
    "uploadClickable",
  ],
  ["TC_AP_559", "Verify supported formats can be uploaded", "formats"],
  ["TC_AP_560", "Verify unsupported formats show error", "unsupported"],
  ["TC_AP_561", "Verify maximum file size validation", "maximum"],
  ["TC_AP_5620", "Verify minimum file size validation", "minimum"],
  [
    "TC_AP_562",
    "Verify successful upload displays preview or filename",
    "uploadPreview",
  ],
  ["TC_AP_563", "Verify replacing an uploaded file", "replace"],
  [
    "TC_AP_564",
    "Verify upload works for multiple options independently",
    "multiple",
  ],
  ["TC_AP_565", "Verify behaviour when no file is selected", "missing"],
  [
    "TC_AP_566",
    "Verify when the checklist with image is added field in preveiw page the image with checklist should be shown",
    "fieldPreview",
  ],
];

const imageRadioCases: Array<[string, string, ImageCaseAction]> = [
  [
    "TC_AP_567",
    "Verify Radio button with images modal opens on clicking the “+” icon",
    "open",
  ],
  ["TC_AP_568", "Verify Field Label is mandatory", "mandatory"],
  [
    "TC_AP_569",
    "Verify validation when entering only spaces in Field Label",
    "spaces",
  ],
  ["TC_AP_570", "Verify valid Field Label is accepted", "valid"],
  ["TC_AP_571", "Verify Required checkbox functionality", "required"],
  ["TC_AP_572", "Verify unchecked Required checkbox behavior", "unchecked"],
  [
    "TC_AP_573",
    "Verify Cancel button closes the modal without saving",
    "cancel",
  ],
  ["TC_AP_574", "Verify Close (X) icon closes modal", "close"],
  ["TC_AP_575", "Verify modal resets when reopened", "reset"],
  ["TC_AP_576", "Verify maximum character limit for Field Label", "labelLimit"],
  ["TC_AP_577", "Verify special characters in Field Label", "special"],
  ["TC_AP_578", "Verify modal layout/UI elements", "layout"],
  [
    "TC_AP_579",
    "Verify radio option loads properly with image-upload options",
    "loads",
  ],
  [
    "TC_AP_580",
    "Verify upload button is clickable for each radio option",
    "uploadClickable",
  ],
  ["TC_AP_581", "Verify supported formats can be uploaded", "formats"],
  ["TC_AP_582", "Verify unsupported formats show error", "unsupported"],
  ["TC_AP_583", "Verify maximum file size 5mb  validation", "maximum"],
  ["TC_AP_5840", "Verify minimum file size validation", "minimum"],
  [
    "TC_AP_584",
    "Verify successful upload displays preview or filename",
    "uploadPreview",
  ],
  ["TC_AP_585", "Verify replacing an uploaded file", "replace"],
  [
    "TC_AP_586",
    "Verify upload works for multiple options independently",
    "multiple",
  ],
  ["TC_AP_587", "Verify behaviour when no file is selected", "missing"],
  [
    "TC_AP_588",
    "Verify when the radio with image is added field in preveiw page the image with radio format should be shown",
    "fieldPreview",
  ],
];

for (const [id, title, action] of imageChecklistCases) {
  test(`${id} - ${title}`, async ({ formBuilderPage }) => {
    await runImageCase(formBuilderPage, "imageChecklist", action);
  });
}

for (const [id, title, action] of imageRadioCases) {
  test(`${id} - ${title}`, async ({ formBuilderPage }) => {
    await runImageCase(formBuilderPage, "imageRadio", action);
  });
}

type SimpleCaseAction =
  | "open"
  | "mandatory"
  | "spaces"
  | "valid"
  | "required"
  | "unchecked"
  | "cancel"
  | "close"
  | "reset"
  | "labelLimit"
  | "layout"
  | "preview";

type SimpleCase = {
  id: string;
  title: string;
  action: SimpleCaseAction;
};

async function runSimpleCase(
  formBuilderPage: FormBuilderPage,
  type: SimpleElementType,
  action: SimpleCaseAction,
) {
  if (action === "open") {
    await formBuilderPage.openElementModal(type);
    await formBuilderPage.expectElementModal(type);
    return;
  }
  if (action === "mandatory" || action === "spaces") {
    await formBuilderPage.openElementModal(type);
    if (action === "spaces")
      await formBuilderPage.fieldLabelInput().fill("   ");
    await formBuilderPage.addFieldButton().click();
    await formBuilderPage.expectValidationMessage(
      FormsData.builder.errors.labelRequired,
    );
    return;
  }
  if (action === "valid" || action === "required" || action === "unchecked") {
    const required = action === "required";
    const label = uniqueLabel(`${type}-${action}`);
    await formBuilderPage.addElement(type, { label, required });
    await expect(formBuilderPage.previewField(label)).toBeVisible();
    if (action !== "valid") {
      await expect(formBuilderPage.previewRequiredCheckbox(label)).toBeChecked({
        checked: required,
      });
    }
    return;
  }
  if (action === "cancel" || action === "close") {
    const label = uniqueLabel(`${type}-cancel`);
    await formBuilderPage.openElementModal(type);
    await formBuilderPage.fillElementModal({ label });
    if (action === "close") {
      await formBuilderPage
        .elementModal()
        .getByRole("button", { name: "Close" })
        .click();
      await expect(formBuilderPage.elementModal()).toBeHidden();
    } else {
      await formBuilderPage.cancelElementModal();
    }
    await expect(formBuilderPage.previewField(label)).toHaveCount(0);
    return;
  }
  if (action === "reset") {
    await formBuilderPage.openElementModal(type);
    await formBuilderPage.fillElementModal({
      label: uniqueLabel(`${type}-reset`),
      description: "Reset this description",
      required: true,
    });
    await formBuilderPage.cancelElementModal();
    await formBuilderPage.openElementModal(type);
    await expect(formBuilderPage.fieldLabelInput()).toHaveValue("");
    await expect(formBuilderPage.fieldDescriptionInput()).toHaveValue("");
    await expect(formBuilderPage.modalRequiredCheckbox()).not.toBeChecked();
    return;
  }
  if (action === "labelLimit") {
    await formBuilderPage.openElementModal(type);
    await expect(formBuilderPage.fieldLabelInput()).toHaveAttribute(
      "maxlength",
      String(FormsData.builder.limits.fieldLabel),
    );
    await formBuilderPage
      .fieldLabelInput()
      .fill("L".repeat(FormsData.builder.limits.fieldLabel + 10));
    await expect(formBuilderPage.fieldLabelInput()).toHaveValue(
      "L".repeat(FormsData.builder.limits.fieldLabel),
    );
    return;
  }
  if (action === "layout") {
    await formBuilderPage.openElementModal(type);
    await expect(formBuilderPage.fieldLabelInput()).toBeVisible();
    await expect(formBuilderPage.fieldDescriptionInput()).toBeVisible();
    await expect(formBuilderPage.modalRequiredCheckbox()).toBeVisible();
    await expect(formBuilderPage.addFieldButton()).toBeVisible();
    await expect(formBuilderPage.cancelElementButton()).toBeVisible();
    return;
  }

  const label = uniqueLabel(`${type}-preview`);
  await formBuilderPage.addElement(type, { label });
  if (type === "date") {
    await expect(formBuilderPage.previewDateInput(label)).toBeVisible();
    return;
  }
  if (type === "time") {
    await expect(formBuilderPage.previewTimeInput(label)).toBeVisible();
    return;
  }

  // imageUpload / fileUpload: Ant Design Upload keeps the native file input hidden.
  await expect(formBuilderPage.previewUploadButton(label)).toBeVisible();
  const input = formBuilderPage.previewFileInput(label);
  await expect(input).toBeAttached();
  if (type === "imageUpload") {
    await expect(input).toHaveAttribute(
      "accept",
      FormsData.builder.labels.imageAccept,
    );
  }
  expect(
    await input.evaluate(
      (element: HTMLInputElement) => element.files?.length ?? -1,
    ),
  ).toBe(0);
}

const imageAttachmentCases: SimpleCase[] = [
  [
    "TC_AP_589",
    "Verify image attachment modal opens on clicking the “+” icon",
    "open",
  ],
  ["TC_AP_590", "Verify Field Label is mandatory", "mandatory"],
  [
    "TC_AP_591",
    "Verify validation when entering only spaces in Field Label",
    "spaces",
  ],
  ["TC_AP_592", "Verify valid Field Label is accepted", "valid"],
  ["TC_AP_593", "Verify Required checkbox functionality", "required"],
  ["TC_AP_594", "Verify unchecked Required checkbox behavior", "unchecked"],
  [
    "TC_AP_595",
    "Verify Cancel button closes the modal without saving",
    "cancel",
  ],
  ["TC_AP_596", "Verify Close (X) icon closes modal", "close"],
  ["TC_AP_597", "Verify modal resets when reopened", "reset"],
  ["TC_AP_598", "Verify maximum character limit for Field Label", "labelLimit"],
  ["TC_AP_600", "Verify modal layout/UI elements", "layout"],
  [
    "TC_AP_601",
    "Verify once all the field is added in the preview screen it must appear as choose file placeholder",
    "preview",
  ],
].map(([id, title, action]) => ({ id, title, action })) as SimpleCase[];

const fileAttachmentCases: SimpleCase[] = [
  [
    "TC_AP_602",
    "Verify File attachment modal opens on clicking the “+” icon",
    "open",
  ],
  ["TC_AP_603", "Verify Field Label is mandatory", "mandatory"],
  [
    "TC_AP_604",
    "Verify validation when entering only spaces in Field Label",
    "spaces",
  ],
  ["TC_AP_605", "Verify valid Field Label is accepted", "valid"],
  ["TC_AP_606", "Verify Required checkbox functionality", "required"],
  ["TC_AP_607", "Verify unchecked Required checkbox behavior", "unchecked"],
  [
    "TC_AP_608",
    "Verify Cancel button closes the modal without saving",
    "cancel",
  ],
  ["TC_AP_609", "Verify Close (X) icon closes modal", "close"],
  ["TC_AP_610", "Verify modal resets when reopened", "reset"],
  ["TC_AP_611", "Verify maximum character limit for Field Label", "labelLimit"],
  ["TC_AP_613", "Verify modal layout/UI elements", "layout"],
  [
    "TC_AP_614",
    "Verify once all the field is added in the preview screen it must appear as choose file placeholder",
    "preview",
  ],
].map(([id, title, action]) => ({ id, title, action })) as SimpleCase[];

const dateCases: SimpleCase[] = [
  [
    "TC_AP_615",
    "Verify File attachment modal opens on clicking the “+” icon",
    "open",
  ],
  ["TC_AP_616", "Verify Field Label is mandatory", "mandatory"],
  [
    "TC_AP_617",
    "Verify validation when entering only spaces in Field Label",
    "spaces",
  ],
  ["TC_AP_618", "Verify valid Field Label is accepted", "valid"],
  ["TC_AP_619", "Verify Required checkbox functionality", "required"],
  ["TC_AP_620", "Verify unchecked Required checkbox behavior", "unchecked"],
  [
    "TC_AP_621",
    "Verify Cancel button closes the modal without saving",
    "cancel",
  ],
  ["TC_AP_622", "Verify Close (X) icon closes modal", "close"],
  ["TC_AP_623", "Verify modal resets when reopened", "reset"],
  ["TC_AP_624", "Verify maximum character limit for Field Label", "labelLimit"],
  ["TC_AP_626", "Verify modal layout/UI elements", "layout"],
  [
    "TC_AP_627",
    "Verify the Date picker loads correctly after the field is added",
    "preview",
  ],
].map(([id, title, action]) => ({ id, title, action })) as SimpleCase[];

const timeCases: SimpleCase[] = [
  ["TC_AP_628", "Verify Time modal opens on clicking the “+” icon", "open"],
  ["TC_AP_629", "Verify Field Label is mandatory", "mandatory"],
  [
    "TC_AP_630",
    "Verify validation when entering only spaces in Field Label",
    "spaces",
  ],
  ["TC_AP_631", "Verify valid Field Label is accepted", "valid"],
  ["TC_AP_632", "Verify Required checkbox functionality", "required"],
  ["TC_AP_633", "Verify unchecked Required checkbox behavior", "unchecked"],
  [
    "TC_AP_634",
    "Verify Cancel button closes the modal without saving",
    "cancel",
  ],
  ["TC_AP_635", "Verify Close (X) icon closes modal", "close"],
  ["TC_AP_636", "Verify modal resets when reopened", "reset"],
  ["TC_AP_637", "Verify maximum character limit for Field Label", "labelLimit"],
  ["TC_AP_639", "Verify modal layout/UI elements", "layout"],
  [
    "TC_AP_640",
    "Verify the time picker loads correctly after the field is added",
    "preview",
  ],
].map(([id, title, action]) => ({ id, title, action })) as SimpleCase[];

for (const [type, cases] of [
  ["imageUpload", imageAttachmentCases],
  ["fileUpload", fileAttachmentCases],
  ["date", dateCases],
  ["time", timeCases],
] as const) {
  for (const { id, title, action } of cases) {
    test(`${id} - ${title}`, async ({ formBuilderPage }) => {
      await runSimpleCase(formBuilderPage, type, action);
    });
  }
}

const allElementTypes = Object.keys(
  FormsData.builder.elementTypes,
) as FormBuilderElementType[];

function optionsFor(
  type: FormBuilderElementType,
  label: string,
): AddFormElementOptions {
  const base: AddFormElementOptions = { label };
  if (type === "dropdown" || type === "checklist" || type === "radio") {
    return {
      ...base,
      options: [{ label: `${label} option`, value: `${label}-value` }],
    };
  }
  if (type === "imageChecklist" || type === "imageRadio") {
    return { ...base, imageOptions: [imageOption(`${label} option`)] };
  }
  if (type === "rating") return { ...base, maxRating: 5 };
  if (type === "slider") return { ...base, min: 0, max: 10, step: 1 };
  return base;
}

test("TC_AP_641 - Verify that delete functionality in all elements in preview screen", async ({
  formBuilderPage,
}) => {
  const labels = new Map<FormBuilderElementType, string>();
  for (const [index, type] of allElementTypes.entries()) {
    await test.step(`Add ${FormsData.builder.elementTypes[type].label}`, async () => {
      const label = uniqueLabel(`delete-${index}-${type}`);
      labels.set(type, label);
      await formBuilderPage.addElement(type, optionsFor(type, label));
    });
  }
  for (const type of allElementTypes) {
    await test.step(`Delete ${FormsData.builder.elementTypes[type].label}`, async () => {
      await formBuilderPage.removeElement(labels.get(type)!);
    });
  }
  await expect(formBuilderPage.emptyPreviewMessage()).toBeVisible();
});

test("TC_AP_642 - Verify that edit functionality in elements in preview screen", async ({
  formBuilderPage,
}) => {
  for (const [index, type] of allElementTypes.entries()) {
    await test.step(`Edit ${FormsData.builder.elementTypes[type].label}`, async () => {
      const original = uniqueLabel(`edit-${index}-${type}`);
      const updated = uniqueLabel(`edited-${index}-${type}`);
      await formBuilderPage.addElement(type, optionsFor(type, original));
      const changes: AddFormElementOptions =
        type === "rating"
          ? { label: updated, maxRating: 6 }
          : type === "slider"
            ? { label: updated, min: 1, max: 9, step: 2 }
            : { label: updated };
      await formBuilderPage.editElement(original, changes);
      await expect(formBuilderPage.previewField(original)).toHaveCount(0);
      await expect(formBuilderPage.previewField(updated)).toBeVisible();
    });
  }
});

test("TC_AP_643 - Verify the required checkbox functionality from the preview screen", async ({
  formBuilderPage,
}) => {
  for (const [index, type] of allElementTypes.entries()) {
    await test.step(`Toggle ${FormsData.builder.elementTypes[type].label}`, async () => {
      const label = uniqueLabel(`required-${index}-${type}`);
      await formBuilderPage.addElement(type, optionsFor(type, label));
      await formBuilderPage.setPreviewRequired(label, true);
      await formBuilderPage.setPreviewRequired(label, false);
    });
  }
});

async function createDisposableForm(
  formBuilderPage: FormBuilderPage,
  suffix: string,
) {
  const data = uniqueFormBuilderData(suffix);
  await formBuilderPage.navigateToBuilder();
  await formBuilderPage.fillFormDetails(data.formName, data.description);
  await formBuilderPage.addElement("singleLine", { label: data.fieldLabel });
  await formBuilderPage.saveDisposableForm(data.formName);
  return data;
}

test("TC_AP_644 - Verify the view action functionality in form main screen", async ({
  formBuilderPage,
  formsPage,
}) => {
  const data = await createDisposableForm(formBuilderPage, "view");
  await formsPage.ensureFormsReady();
  await formsPage.openFormView(data.formName);
  await expect(formsPage.formDetailsDrawer()).toContainText(data.description);
  await expect(formsPage.formDetailsDrawer()).toContainText(data.fieldLabel);
  await formsPage.closeFormView();
});

test("TC_AP_645 - Verify the edit action from the main form screen", async ({
  formBuilderPage,
  formsPage,
}) => {
  const original = await createDisposableForm(formBuilderPage, "edit-source");
  await formsPage.ensureFormsReady();
  await formsPage.openFormEdit(original.formName);
  await formBuilderPage.expectBuilderLoaded();
  await formBuilderPage.expectFormDetails(
    original.formName,
    original.description,
  );
  const renamed = uniqueFormBuilderData("edit-renamed");
  formBuilderPage.registerDisposableForm(renamed.formName);
  await formBuilderPage.fillFormDetails(renamed.formName, renamed.description);
  await formBuilderPage.updateForm();
  await formsPage.ensureFormsReady();
  await expect(formsPage.formRow(renamed.formName)).toBeVisible();
});

test("TC_AP_646 - Verify the copy form action functionality from the main screen", async ({
  formBuilderPage,
  formsPage,
}) => {
  const source = await createDisposableForm(formBuilderPage, "copy-source");
  await formsPage.ensureFormsReady();
  await formsPage.openFormCopy(source.formName);
  await formBuilderPage.expectBuilderLoaded();
  await expect(formBuilderPage.formNameInput()).toHaveValue(
    `${FormsData.builder.manage.copiedNamePrefix}${source.formName}`,
  );
  const copied = uniqueFormBuilderData("copy-result");
  await formBuilderPage.fillFormDetails(copied.formName, copied.description);
  await formBuilderPage.saveDisposableForm(copied.formName);
  await formsPage.ensureFormsReady();
  await expect(formsPage.formRow(copied.formName)).toBeVisible();
});

test("TC_AP_647 - Verify the delete action functionality from the form main screen", async ({
  formBuilderPage,
  formsPage,
}) => {
  const data = await createDisposableForm(formBuilderPage, "delete");
  await formsPage.ensureFormsReady();
  await formsPage.openFormDelete(data.formName);
  await formsPage.confirmFormDelete(data.formName);
});
