import {
  expect,
  type Locator,
  type Page,
  type Response as PlaywrightResponse,
} from "@playwright/test";
import { getApiBaseUrl } from "../config/appConfig";
import {
  FormsData,
  type FormBuilderElementType,
  uniqueFormBuilderData,
} from "../data/FormsData";
import { ensureAuthenticated as restoreSession } from "../utils/ensureAuthenticated";

export type FormBuilderOption = {
  label: string;
  value: string;
};

export type FormBuilderImageOption = {
  label: string;
  file?: {
    name: string;
    mimeType: string;
    buffer: Buffer;
  };
};

export type AddFormElementOptions = {
  label: string;
  description?: string;
  required?: boolean;
  options?: FormBuilderOption[];
  imageOptions?: FormBuilderImageOption[];
  min?: number;
  max?: number;
  step?: number;
  maxRating?: number;
};

type DisposableForm = {
  id?: string;
  name: string;
};

export class FormBuilderPage {
  readonly page: Page;
  private readonly disposableForms = new Map<string, DisposableForm>();

  constructor(page: Page) {
    this.page = page;
  }

  // ── Navigation and page state ───────────────────────────────────────────────

  isOnBuilderPage(): boolean {
    const pathname = new URL(this.page.url()).pathname.replace(/\/$/, "");
    return pathname === FormsData.formBuilderPath;
  }

  async ensureAuthenticated() {
    await restoreSession(this.page);
  }

  async navigateToBuilder() {
    if (!this.isOnBuilderPage()) {
      await this.page.goto(FormsData.formBuilderPath, {
        waitUntil: "commit",
        timeout: 120_000,
      });
    }
    await this.ensureAuthenticated();
    if (!this.isOnBuilderPage()) {
      await this.page.goto(FormsData.formBuilderPath, {
        waitUntil: "commit",
        timeout: 120_000,
      });
    }
    await this.expectBuilderLoaded();
  }

  async openFromFormsList() {
    await expect(
      this.page.getByRole("button", { name: /create form/i }),
    ).toBeVisible({
      timeout: 30_000,
    });
    await this.page.getByRole("button", { name: /create form/i }).click();
    await this.expectBuilderLoaded();
  }

  async openExistingFormForEdit(name: string) {
    if (
      new URL(this.page.url()).pathname.replace(/\/$/, "") !== FormsData.path
    ) {
      await this.page.goto(FormsData.path, {
        waitUntil: "commit",
        timeout: 120_000,
      });
    }

    const row = this.page.locator(".ant-table-tbody tr.ant-table-row").filter({
      has: this.page.locator("td").first().getByText(name, { exact: true }),
    });
    await expect(row).toBeVisible({ timeout: 30_000 });
    await row.getByRole("button", { name: "edit", exact: true }).click();
    await this.expectBuilderLoaded();
    await expect(this.updateFormButton()).toBeVisible({ timeout: 30_000 });
    await expect(this.formNameInput()).toHaveValue(name);
  }

  async expectBuilderLoaded() {
    await expect(this.title()).toBeVisible({ timeout: 30_000 });
    await expect(this.formDetailsCard()).toBeVisible({ timeout: 30_000 });
    await expect(this.formNameInput()).toBeVisible({ timeout: 30_000 });
    await expect(this.availableElementsHeading()).toBeVisible({
      timeout: 30_000,
    });
  }

  async resetAfterTest() {
    await this.closeElementModalIfOpen();
    await this.cleanupDisposableForms();

    if (
      new URL(this.page.url()).pathname.replace(/\/$/, "") !== FormsData.path
    ) {
      await this.page
        .goto(FormsData.path, { waitUntil: "commit", timeout: 120_000 })
        .catch(() => undefined);
    }
  }

  // ── Page locators ───────────────────────────────────────────────────────────

  title = () =>
    this.page.getByRole("heading", {
      name: FormsData.builder.labels.title,
      exact: true,
    });

  subtitle = () =>
    this.page.getByText(FormsData.builder.labels.subtitle, { exact: true });

  backToFormsButton = () =>
    this.page.getByRole("button", {
      name: FormsData.builder.labels.backToForms,
      exact: true,
    });

  viewSubmissionsButton = () =>
    this.page.getByRole("button", {
      name: FormsData.builder.labels.viewSubmissions,
      exact: true,
    });

  formDetailsCard = () =>
    this.page.locator(".ant-card").filter({
      has: this.page.getByText(FormsData.builder.labels.formDetails, {
        exact: true,
      }),
    });

  formNameInput = () =>
    this.formDetailsCard().getByRole("textbox", {
      name: new RegExp(`${FormsData.builder.labels.formName}$`, "i"),
    });

  formDescriptionInput = () =>
    this.formDetailsCard().getByRole("textbox", {
      name: FormsData.builder.labels.description,
      exact: true,
    });

  availableElementsHeading = () =>
    this.formDetailsCard().getByRole("heading", {
      name: FormsData.builder.labels.availableElements,
      exact: true,
    });

  elementLibraryRow = (type: FormBuilderElementType) =>
    this.formDetailsCard()
      .locator(".ant-list-item")
      .filter({
        hasText: new RegExp(
          `^\\s*${this.escapeRegExp(FormsData.builder.elementTypes[type].label)}\\s*Add\\s*$`,
        ),
      });

  addElementButton = (type: FormBuilderElementType) =>
    this.elementLibraryRow(type).getByRole("button", {
      name: new RegExp(`${FormsData.builder.labels.add}$`, "i"),
    });

  previewArea = () => this.page.locator(".form-builder-layout > .ant-col-16");

  previewHeading = (name: string | RegExp) =>
    this.previewArea().getByRole("heading", {
      name,
      exact: typeof name === "string",
    });

  previewDescription = (description: string | RegExp) =>
    this.previewArea().getByText(description, {
      exact: typeof description === "string",
    });

  emptyPreviewMessage = () =>
    this.previewArea().getByText(FormsData.builder.labels.emptyPreview, {
      exact: true,
    });

  previewField = (label: string) =>
    this.previewArea()
      .locator(".ant-form-item")
      .filter({ has: this.page.getByText(label, { exact: true }) })
      .first();

  previewFieldControl = (label: string) =>
    this.previewField(label).locator("input, textarea, .ant-select").first();

  previewCheckbox = (label: string, optionLabel: string | RegExp) =>
    this.previewField(label).getByRole("checkbox", {
      name: optionLabel,
      exact: typeof optionLabel === "string",
    });

  previewChecklistOption = (label: string, optionLabel: string | RegExp) =>
    this.previewCheckbox(label, optionLabel);

  previewRadio = (label: string, optionLabel: string | RegExp) =>
    this.previewField(label).getByRole("radio", {
      name: optionLabel,
      exact: typeof optionLabel === "string",
    });

  previewRadioOption = (label: string, optionLabel: string | RegExp) =>
    this.previewRadio(label, optionLabel);

  previewOptionImage = (label: string, optionLabel: string) =>
    this.previewField(label).getByRole("img", {
      name: optionLabel,
      exact: true,
    });

  previewFileInput = (label: string) =>
    this.previewField(label).locator('input[type="file"]');

  /** Visible Ant Upload trigger in the builder preview (native file input stays hidden). */
  previewUploadButton = (label: string) =>
    this.previewField(label).getByRole("button", {
      name: FormsData.builder.labels.browseFile,
    });

  previewDateInput = (label: string) =>
    this.previewField(label).locator(".ant-picker input").first();

  previewTimeInput = (label: string) =>
    this.previewField(label).locator('input[type="time"]');

  previewSlider = (label: string) =>
    this.previewField(label).getByRole("slider");

  previewRating = (label: string) =>
    this.previewField(label).getByRole("radiogroup");

  previewRatingStars = (label: string) =>
    this.previewRating(label).getByRole("radio");

  previewRatingStar = (label: string, position: number) => {
    if (!Number.isInteger(position) || position < 1) {
      throw new Error("Rating star position must be a positive integer");
    }
    return this.previewRatingStars(label).nth(position - 1);
  };

  previewRequiredCheckbox = (label: string) =>
    this.previewField(label).getByRole("checkbox", {
      name: FormsData.builder.labels.required,
      exact: true,
    });

  previewEditButton = (label: string) =>
    this.previewField(label).getByRole("button", { name: "edit", exact: true });

  previewSettingButton = (label: string) =>
    this.previewField(label).getByRole("button", {
      name: "setting",
      exact: true,
    });

  previewDeleteButton = (label: string) =>
    this.previewField(label).getByRole("button", {
      name: "delete",
      exact: true,
    });

  saveFormButton = () =>
    this.previewArea().getByRole("button", {
      name: FormsData.builder.labels.saveForm,
      exact: true,
    });

  updateFormButton = () =>
    this.previewArea().getByRole("button", {
      name: FormsData.builder.labels.updateForm,
      exact: true,
    });

  toast = (message: string | RegExp) =>
    this.page
      .locator(".ant-message-notice-content")
      .filter({ hasText: message });

  // ── Element modal locators ──────────────────────────────────────────────────

  elementModal = () => this.page.getByRole("dialog");

  elementModalTitle = () => this.elementModal().locator(".ant-modal-title");

  fieldLabelInput = () =>
    this.elementModal().getByRole("textbox", {
      name: new RegExp(`${FormsData.builder.labels.fieldLabel}$`, "i"),
    });

  fieldDescriptionInput = () =>
    this.elementModal().getByPlaceholder(
      FormsData.builder.labels.fieldDescriptionPlaceholder,
      {
        exact: true,
      },
    );

  modalRequiredCheckbox = () =>
    this.elementModal().getByRole("checkbox", {
      name: FormsData.builder.labels.required,
      exact: true,
    });

  optionLabelInputs = () =>
    this.elementModal().getByPlaceholder(FormsData.builder.labels.optionLabel, {
      exact: true,
    });

  optionValueInputs = () =>
    this.elementModal().getByPlaceholder(FormsData.builder.labels.optionValue, {
      exact: true,
    });

  imageUploadInputs = () => this.elementModal().locator('input[type="file"]');

  imageUploadButton = (index: number) =>
    this.elementModal().locator(".ant-upload button").nth(index);

  modalImagePreviews = () =>
    this.elementModal().locator(
      'img[src^="blob:"], img[src^="http"], img[src^="https"]',
    );

  sliderMinimumInput = () =>
    this.elementModal().getByRole("spinbutton", {
      name: this.requiredLabelPattern(FormsData.builder.labels.minimumValue),
    });

  sliderMaximumInput = () =>
    this.elementModal().getByRole("spinbutton", {
      name: this.requiredLabelPattern(FormsData.builder.labels.maximumValue),
    });

  sliderStepInput = () =>
    this.elementModal().getByRole("spinbutton", {
      name: this.requiredLabelPattern(FormsData.builder.labels.step),
    });

  ratingStarCountInput = () =>
    this.elementModal().getByRole("spinbutton", {
      name: this.requiredLabelPattern(FormsData.builder.labels.numberOfStars),
    });

  optionRow = (index: number) =>
    this.optionLabelInputs()
      .nth(index)
      .locator('xpath=ancestor::*[contains(@class,"ant-row")][1]');

  optionRemoveButton = (index: number) =>
    this.elementModal()
      .getByRole("button", {
        name: FormsData.builder.labels.remove,
        exact: true,
      })
      .nth(index);

  addOptionButton = () =>
    this.elementModal().getByRole("button", {
      name: FormsData.builder.labels.addOption,
      exact: true,
    });

  addFieldButton = () =>
    this.elementModal().getByRole("button", {
      name: FormsData.builder.labels.addField,
      exact: true,
    });

  cancelElementButton = () =>
    this.elementModal().getByRole("button", {
      name: FormsData.builder.labels.cancel,
      exact: true,
    });

  // ── Reusable builder actions ────────────────────────────────────────────────

  async fillFormDetails(name: string, description?: string) {
    await this.formNameInput().fill(name);
    if (description !== undefined) {
      await this.formDescriptionInput().fill(description);
    }
  }

  async openElementModal(type: FormBuilderElementType) {
    await this.addElementButton(type).click();
    await expect(this.elementModal()).toBeVisible({ timeout: 15_000 });
    await expect(this.elementModalTitle()).toContainText(
      FormsData.builder.elementTypes[type].label,
    );
  }

  async fillElementModal(options: AddFormElementOptions) {
    await this.fieldLabelInput().fill(options.label);

    if (
      options.description !== undefined &&
      (await this.fieldDescriptionInput().count()) > 0
    ) {
      await this.fieldDescriptionInput().fill(options.description);
    }

    if (options.options) {
      await this.setOptions(options.options);
    }

    if (options.imageOptions) {
      await this.setImageOptions(options.imageOptions);
    }

    if (options.min !== undefined) {
      await this.sliderMinimumInput().fill(String(options.min));
    }

    if (options.max !== undefined) {
      await this.sliderMaximumInput().fill(String(options.max));
    }

    if (options.step !== undefined) {
      await this.sliderStepInput().fill(String(options.step));
    }

    if (options.maxRating !== undefined) {
      await this.ratingStarCountInput().fill(String(options.maxRating));
    }

    if (options.required !== undefined) {
      await this.setCheckbox(this.modalRequiredCheckbox(), options.required);
    }
  }

  async setOption(index: number, option: FormBuilderOption) {
    while ((await this.optionLabelInputs().count()) <= index) {
      await this.addOptionButton().click();
    }
    await this.optionLabelInputs().nth(index).fill(option.label);
    await this.optionValueInputs().nth(index).fill(option.value);
  }

  async setOptions(options: FormBuilderOption[]) {
    if (options.length === 0) {
      throw new Error(
        "At least one option is required by the current Form Builder",
      );
    }

    while ((await this.optionLabelInputs().count()) > options.length) {
      await this.optionRemoveButton(
        (await this.optionLabelInputs().count()) - 1,
      ).click();
    }

    for (let index = 0; index < options.length; index++) {
      await this.setOption(index, options[index]);
    }
  }

  async addOption(option?: FormBuilderOption) {
    const index = await this.optionLabelInputs().count();
    await this.addOptionButton().click();
    if (option) {
      await this.setOption(index, option);
    }
  }

  async setImageOption(index: number, option: FormBuilderImageOption) {
    while ((await this.optionLabelInputs().count()) <= index) {
      await this.addOptionButton().click();
    }
    await this.optionLabelInputs().nth(index).fill(option.label);
    if (option.file) {
      const chooserPromise = this.page.waitForEvent("filechooser");
      await this.imageUploadButton(index).click();
      const chooser = await chooserPromise;
      await chooser.setFiles(option.file);
    }
  }

  async setImageOptions(options: FormBuilderImageOption[]) {
    if (options.length === 0) {
      throw new Error(
        "At least one image option is required by the current Form Builder",
      );
    }
    while ((await this.optionLabelInputs().count()) > options.length) {
      await this.optionRemoveButton(
        (await this.optionLabelInputs().count()) - 1,
      ).click();
    }
    for (let index = 0; index < options.length; index++) {
      await this.setImageOption(index, options[index]);
    }
  }

  async uploadOptionImage(index: number, file: FormBuilderImageOption["file"]) {
    if (!file) throw new Error("An in-memory image payload is required");
    await this.imageUploadInputs().nth(index).setInputFiles(file);
  }

  async removeOption(index: number) {
    await this.optionRemoveButton(index).click();
  }

  async confirmElementModal() {
    await this.addFieldButton().click();
    await expect(this.elementModal()).toBeHidden({ timeout: 15_000 });
  }

  async cancelElementModal() {
    await this.cancelElementButton().click();
    await expect(this.elementModal()).toBeHidden({ timeout: 15_000 });
  }

  async closeElementModalIfOpen() {
    if (
      await this.elementModal()
        .isVisible()
        .catch(() => false)
    ) {
      const closeButton = this.elementModal().getByRole("button", {
        name: "Close",
      });
      if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click({ timeout: 5_000 }).catch(() => undefined);
      } else {
        await this.cancelElementModal().catch(() => undefined);
      }
      await expect(this.elementModal())
        .toBeHidden({ timeout: 5_000 })
        .catch(() => undefined);
    }
  }

  async addElement(
    type: FormBuilderElementType,
    options: AddFormElementOptions,
  ) {
    await this.openElementModal(type);
    await this.fillElementModal(options);
    await this.confirmElementModal();
    await expect(this.previewField(options.label)).toBeVisible();
  }

  async editElement(label: string, changes: AddFormElementOptions) {
    const editButton = this.previewEditButton(label);
    if (await editButton.count()) {
      await editButton.click();
    } else {
      await this.previewSettingButton(label).click();
    }
    await expect(this.elementModal()).toBeVisible({ timeout: 15_000 });
    await this.fillElementModal(changes);
    await this.confirmElementModal();
  }

  async removeElement(label: string) {
    await this.previewDeleteButton(label).click();
    await expect(this.previewField(label)).toHaveCount(0);
  }

  async setPreviewRequired(label: string, required: boolean) {
    await this.setCheckbox(this.previewRequiredCheckbox(label), required);
  }

  async goBackToForms() {
    await this.backToFormsButton().click();
    await expect(this.page).toHaveURL(new RegExp(`${FormsData.path}/?$`), {
      timeout: 30_000,
    });
  }

  async goToSubmissions() {
    await this.viewSubmissionsButton().click();
    await expect(this.page).toHaveURL(
      new RegExp(`${FormsData.formSubmissionsPath}/?$`),
      {
        timeout: 30_000,
      },
    );
  }

  waitForCreateResponse(): Promise<PlaywrightResponse> {
    return this.page.waitForResponse(
      (response) =>
        response.url().includes(FormsData.api.createPath) &&
        response.request().method() === "POST",
      { timeout: 30_000 },
    );
  }

  waitForUpdateResponse(): Promise<PlaywrightResponse> {
    return this.page.waitForResponse(
      (response) =>
        response.url().includes(`${FormsData.api.updatePath}/`) &&
        response.request().method() === "PUT",
      { timeout: 30_000 },
    );
  }

  async saveForm(
    options: { disposableName?: string } = {},
  ): Promise<PlaywrightResponse> {
    const responsePromise = this.waitForCreateResponse();
    await this.saveFormButton().click();
    const response = await responsePromise;
    expect(
      response.ok(),
      `Create form response status was ${response.status()}`,
    ).toBeTruthy();

    if (options.disposableName) {
      const id = await this.extractFormIdFromResponse(
        response,
        options.disposableName,
      );
      this.registerDisposableForm(options.disposableName, id);
    }

    await expect(this.page).toHaveURL(new RegExp(`${FormsData.path}/?$`), {
      timeout: 30_000,
    });
    return response;
  }

  async saveDisposableForm(name: string): Promise<PlaywrightResponse> {
    this.assertDisposableName(name);
    return this.saveForm({ disposableName: name });
  }

  async updateForm(): Promise<PlaywrightResponse> {
    const responsePromise = this.waitForUpdateResponse();
    await this.updateFormButton().click();
    const response = await responsePromise;
    expect(
      response.ok(),
      `Update form response status was ${response.status()}`,
    ).toBeTruthy();
    await expect(this.page).toHaveURL(new RegExp(`${FormsData.path}/?$`), {
      timeout: 30_000,
    });
    return response;
  }

  createUniqueData(suffix = "") {
    return uniqueFormBuilderData(suffix);
  }

  registerDisposableForm(name: string, id?: string) {
    this.assertDisposableName(name);
    this.disposableForms.set(name, { name, id });
  }

  // ── Reusable assertions ─────────────────────────────────────────────────────

  async expectFormDetails(name: string, description = "") {
    await expect(this.formNameInput()).toHaveValue(name);
    await expect(this.formDescriptionInput()).toHaveValue(description);
  }

  async expectPreviewDetails(name: string, description?: string) {
    await expect(this.previewHeading(name)).toBeVisible();
    if (description !== undefined && description !== "") {
      await expect(this.previewDescription(description)).toBeVisible();
    }
  }

  async expectElementModal(type: FormBuilderElementType) {
    await expect(this.elementModal()).toBeVisible();
    await expect(this.elementModalTitle()).toContainText(
      FormsData.builder.elementTypes[type].label,
    );
    await expect(this.fieldLabelInput()).toBeVisible();
  }

  async expectPreviewElement(
    label: string,
    options: { description?: string; required?: boolean } = {},
  ) {
    const field = this.previewField(label);
    await expect(field).toBeVisible();
    if (options.description !== undefined) {
      const selectPlaceholder = field.locator(
        ".ant-select-selection-placeholder",
      );
      if (await selectPlaceholder.count()) {
        await expect(selectPlaceholder).toHaveText(options.description);
      } else {
        await expect(this.previewFieldControl(label)).toHaveAttribute(
          "placeholder",
          options.description,
        );
      }
    }
    if (options.required !== undefined) {
      await expect(this.previewRequiredCheckbox(label)).toBeChecked({
        checked: options.required,
      });
    }
  }

  async expectOptionRows(options: FormBuilderOption[]) {
    await expect(this.optionLabelInputs()).toHaveCount(options.length);
    await expect(this.optionValueInputs()).toHaveCount(options.length);
    for (let index = 0; index < options.length; index++) {
      await expect(this.optionLabelInputs().nth(index)).toHaveValue(
        options[index].label,
      );
      await expect(this.optionValueInputs().nth(index)).toHaveValue(
        options[index].value,
      );
    }
  }

  async expectValidationMessage(message: string | RegExp) {
    await expect(this.elementModal().getByText(message).first()).toBeVisible();
  }

  // ── Disposable-form cleanup ─────────────────────────────────────────────────

  async cleanupDisposableForms() {
    for (const disposable of this.disposableForms.values()) {
      const id =
        disposable.id ?? (await this.findDisposableFormId(disposable.name));
      if (id) {
        await this.deleteFormById(id).catch(() => undefined);
      }
    }
    this.disposableForms.clear();
  }

  private async findDisposableFormId(
    name: string,
  ): Promise<string | undefined> {
    const query = new URLSearchParams({
      page: String(FormsData.api.defaultPage),
      size: "100",
      sort: FormsData.api.defaultSort,
      search: name,
    });
    const response = await this.page.request.get(
      `${getApiBaseUrl()}${FormsData.api.listPath}?${query.toString()}`,
      { headers: await this.getAuthHeaders() },
    );
    if (!response.ok()) return undefined;

    const body = await response.json();
    return this.findFormId(body, name);
  }

  private async deleteFormById(id: string) {
    const response = await this.page.request.delete(
      `${getApiBaseUrl()}${FormsData.api.deletePath}/${id}`,
      { headers: await this.getAuthHeaders() },
    );
    if (!response.ok() && response.status() !== 404) {
      throw new Error(
        `Disposable form cleanup failed with status ${response.status()}`,
      );
    }
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.page.evaluate(() =>
      localStorage.getItem("gulf_net_admin-token"),
    );
    return {
      Authorization: `Bearer ${token ?? ""}`,
      language: "english",
      Accept: "application/json, text/plain, */*",
    };
  }

  private async extractFormIdFromResponse(
    response: PlaywrightResponse,
    name: string,
  ): Promise<string | undefined> {
    const body = await response.json().catch(() => undefined);
    return this.findFormId(body, name);
  }

  private findFormId(value: unknown, name: string): string | undefined {
    if (!value || typeof value !== "object") return undefined;
    if (Array.isArray(value)) {
      for (const item of value) {
        const id = this.findFormId(item, name);
        if (id) return id;
      }
      return undefined;
    }

    const record = value as Record<string, unknown>;
    const recordName =
      (typeof record.name === "string" && record.name) ||
      (typeof record.formName === "string" && record.formName);
    const recordId = record.id ?? record.formId;
    if (
      recordName === name &&
      (typeof recordId === "string" || typeof recordId === "number")
    ) {
      return String(recordId);
    }

    for (const nested of Object.values(record)) {
      const id = this.findFormId(nested, name);
      if (id) return id;
    }
    return undefined;
  }

  private assertDisposableName(name: string) {
    if (!name.startsWith(FormsData.builder.uniqueData.disposablePrefix)) {
      throw new Error(
        `Refusing to auto-delete "${name}". Disposable names must start with ` +
          `"${FormsData.builder.uniqueData.disposablePrefix}".`,
      );
    }
  }

  private async setCheckbox(checkbox: Locator, checked: boolean) {
    if ((await checkbox.isChecked()) !== checked) {
      await checkbox.click();
    }
    await expect(checkbox).toBeChecked({ checked });
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private requiredLabelPattern(label: string): RegExp {
    return new RegExp(
      `^\\s*\\*?\\s*${this.escapeRegExp(label)}\\s*\\*?\\s*$`,
      "i",
    );
  }
}
