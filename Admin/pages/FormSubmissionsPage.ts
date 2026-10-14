import {
  expect,
  type Download,
  type Locator,
  type Page,
  type Request,
  type Response,
} from "@playwright/test";
import { writeFile } from "node:fs/promises";
import { ensureAuthenticated as restoreSession } from "../utils/ensureAuthenticated";
import { isLocalTarget } from "../config/appConfig";
import {
  installLocalSubmissionMocks,
  uninstallLocalSubmissionMocks,
} from "../fixtures/submissionMock";

export const FORM_SUBMISSIONS = {
  path: "/form-submissions",
  title: "Form Submissions",
  /** Placeholder shown when no form is selected (replaces former "All Forms" Select). */
  selectFormPlaceholder: "Select Form",
  formSearchPlaceholder: "Search",
  formNamesApi: "/form/list/names",
  submissionsApi: "forms/submissions",
  exportApi: "forms/submissions/export",
  submittedByPlaceholder: "Search by name",
  fromDatePlaceholder: "From Date",
  toDatePlaceholder: "To Date",
  exportWarning: "Select a form to export submissions.",
  exportSuccess: "Submissions exported successfully!",
  noData: "No data",
  tableColumns: [
    "Form Name",
    "Submitted By",
    "Group Name",
    "Date Created",
    "Actions",
  ],
} as const;

export type SubmissionTableRow = {
  formName: string;
  submittedBy: string;
  groupName: string;
  dateCreated: string;
};

export type ExportDownload = {
  download: Download;
  request: Request;
  filename: string;
};

export type RequestQuery = Record<string, string>;

type SubmissionRequestOptions = {
  submittedByName?: string | null;
  formName?: string | null;
  hasDates?: boolean;
  withoutDates?: boolean;
};

export class FormSubmissionsPage {
  readonly page: Page;
  private formNamesFromApi: string[] = [];

  constructor(page: Page) {
    this.page = page;
  }

  isOnPage(): boolean {
    const url = this.page.url();
    if (!url || url === "about:blank") {
      return false;
    }
    return new URL(url).pathname.replace(/\/$/, "") === FORM_SUBMISSIONS.path;
  }

  async navigate() {
    if (isLocalTarget()) {
      await installLocalSubmissionMocks(this.page);
    }

    // Reload even when the worker page is already here so every opt-in fixture
    // captures the live form-name contract and starts from clean React state.
    await this.gotoAndCaptureInitialRequests();

    await restoreSession(this.page);
    if (!this.isOnPage()) {
      await this.gotoAndCaptureInitialRequests();
    }

    await this.expectReady();
  }

  async resetAfterTest() {
    await this.page.keyboard.press("Escape").catch(() => undefined);

    // Drop local submission routes so later Forms list tests hit the real API
    // (shared worker page otherwise keeps mock form/get/forms and breaks search).
    if (isLocalTarget()) {
      await uninstallLocalSubmissionMocks(this.page);
    }

    if (!this.isOnPage()) {
      return;
    }

    // A document navigation reliably resets React state, open portals, pagination,
    // and all three filters on the worker-scoped page.
    await this.page
      .goto("/forms", {
        waitUntil: "commit",
        timeout: 120_000,
      })
      .catch(() => undefined);
  }

  private async gotoAndCaptureInitialRequests() {
    const namesResponse = this.waitForFormNamesResponse();
    const submissionsRequest = this.page
      .waitForRequest((request) => this.isSubmissionsRequest(request), {
        timeout: 30_000,
      })
      .catch(() => null);
    await this.page.goto(FORM_SUBMISSIONS.path, {
      waitUntil: "commit",
      timeout: 120_000,
    });

    const [names] = await Promise.all([namesResponse, submissionsRequest]);
    if (names) {
      this.formNamesFromApi = await this.extractFormNames(names);
    }
  }

  async expectReady() {
    await expect(this.heading()).toBeVisible({ timeout: 30_000 });
    await expect(this.formSelect()).toBeVisible({ timeout: 30_000 });
    await expect(this.submittedByInput()).toBeVisible({ timeout: 30_000 });
    await expect(this.table()).toBeVisible({ timeout: 30_000 });
    await this.waitForTableIdle();
  }

  heading = () =>
    this.page.getByRole("heading", { name: FORM_SUBMISSIONS.title });

  formSelect = () =>
    this.page.locator("button.form-submissions-form-picker");

  formSearchInput = () =>
    this.page.locator(".form-submissions-form-picker-search input");

  /** @deprecated Use formSearchInput — kept for callers that still fill the search field. */
  formCombobox = () => this.formSearchInput();

  selectedFormLabel = () =>
    this.formSelect().locator(".form-submissions-form-picker-value");

  formClearButton = () =>
    this.page.locator("button.form-submissions-form-picker-clear");

  visibleFormDropdown = () =>
    this.page.locator(".form-submissions-form-picker-dropdown");

  formOptions = () =>
    this.visibleFormDropdown().locator(
      ".form-submissions-form-picker-option",
    );

  formOptionsList = () =>
    this.visibleFormDropdown().locator(".form-submissions-form-picker-list");

  fromDateInput = () =>
    this.page.getByPlaceholder(FORM_SUBMISSIONS.fromDatePlaceholder);

  toDateInput = () =>
    this.page.getByPlaceholder(FORM_SUBMISSIONS.toDatePlaceholder);

  rangePicker = () =>
    this.fromDateInput().locator(
      'xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " ant-picker ")][1]',
    );

  rangeClearButton = () => this.rangePicker().locator(".ant-picker-clear");

  visibleCalendar = () =>
    this.page.locator(".ant-picker-dropdown:not(.ant-picker-dropdown-hidden)");

  calendarPanels = () => this.visibleCalendar().locator(".ant-picker-panel");

  calendarPanelLabels = () =>
    this.calendarPanels().locator(".ant-picker-header-view");

  submittedByInput = () =>
    this.page.getByPlaceholder(FORM_SUBMISSIONS.submittedByPlaceholder);

  submittedBySearchButton = () =>
    this.submittedByInput()
      .locator('xpath=ancestor::*[contains(@class,"ant-input-search")][1]')
      .getByRole("button");

  table = () => this.page.locator(".ant-table");

  tableHeaders = () => this.table().locator("thead th");

  tableRows = () => this.table().locator("tbody tr.ant-table-row");

  noData = () =>
    this.table().getByText(FORM_SUBMISSIONS.noData, { exact: true });

  exportButton = () => this.page.getByRole("button", { name: /export/i });

  toast = (text: string | RegExp) =>
    this.page.locator(".ant-message-notice-content").filter({ hasText: text });

  async getSelectedFormLabel(): Promise<string> {
    return (await this.selectedFormLabel().textContent())?.trim() ?? "";
  }

  async hasSelectedForm(): Promise<boolean> {
    const label = await this.getSelectedFormLabel();
    return (
      Boolean(label) && label !== FORM_SUBMISSIONS.selectFormPlaceholder
    );
  }

  async openFormDropdown() {
    if (
      !(await this.visibleFormDropdown()
        .isVisible()
        .catch(() => false))
    ) {
      await this.formSelect().click();
    }
    await expect(this.visibleFormDropdown()).toBeVisible({ timeout: 15_000 });
  }

  async closeFormDropdown() {
    if (
      await this.visibleFormDropdown()
        .isVisible()
        .catch(() => false)
    ) {
      await this.page.keyboard.press("Escape");
      await expect(this.visibleFormDropdown()).toBeHidden();
    }
  }

  async getVisibleFormOptionLabels(): Promise<string[]> {
    await this.openFormDropdown();
    return this.formOptions().evaluateAll((options) =>
      options
        .map((option) => (option.textContent ?? "").trim())
        .filter(Boolean),
    );
  }

  async getAllFormOptionLabels(): Promise<string[]> {
    await this.openFormDropdown();
    await this.formSearchInput().fill("");
    // Custom picker renders all options in the DOM (no virtual list).
    return this.getVisibleFormOptionLabels();
  }

  getLoadedFormNames(): string[] {
    return [...this.formNamesFromApi];
  }

  async dropdownHasScrollableList(): Promise<boolean> {
    await this.openFormDropdown();
    const list = this.formOptionsList();
    if (!(await list.isVisible().catch(() => false))) {
      return false;
    }
    return list.evaluate(
      (element) => element.scrollHeight > element.clientHeight + 1,
    );
  }

  async searchFormOptions(term: string): Promise<string[]> {
    await this.openFormDropdown();
    await this.formSearchInput().fill(term);
    await this.page.waitForTimeout(100);
    return this.formOptions().evaluateAll((options) =>
      options
        .map((option) => (option.textContent ?? "").trim())
        .filter(Boolean),
    );
  }

  async selectForm(formName: string): Promise<RequestQuery> {
    await this.openFormDropdown();
    await this.formSearchInput().fill(formName);
    await this.page.waitForTimeout(100);

    const requestPromise = this.waitForSubmissionRequest({ formName });
    const option = this.formOptions().filter({ hasText: formName }).first();
    await option.click();
    const request = await requestPromise;
    await this.waitForTableIdle();
    await expect(this.selectedFormLabel()).toHaveText(formName);
    return this.queryFromRequest(request);
  }

  async selectFirstSpecificForm(): Promise<string | null> {
    const labels = await this.getAllFormOptionLabels();
    await this.closeFormDropdown();
    const formName = labels[0] ?? null;
    if (formName) {
      await this.selectForm(formName);
    }
    return formName;
  }

  async clearFormSelection(): Promise<RequestQuery> {
    if (!(await this.hasSelectedForm())) {
      return {};
    }
    await this.openFormDropdown();
    const requestPromise = this.waitForSubmissionRequest({ formName: null });
    await expect(this.formClearButton()).toBeEnabled();
    await this.formClearButton().click();
    const request = await requestPromise;
    await this.waitForTableIdle();
    await expect(this.selectedFormLabel()).toHaveText(
      FORM_SUBMISSIONS.selectFormPlaceholder,
    );
    return this.queryFromRequest(request);
  }

  async openCalendar(input: "from" | "to" = "from") {
    await (
      input === "from" ? this.fromDateInput() : this.toDateInput()
    ).click();
    await expect(this.visibleCalendar()).toBeVisible({ timeout: 15_000 });
  }

  async closeCalendar() {
    if (
      await this.visibleCalendar()
        .isVisible()
        .catch(() => false)
    ) {
      await this.page.keyboard.press("Escape");
      await expect(this.visibleCalendar()).toBeHidden();
    }
  }

  async getCalendarPanelLabels(): Promise<string[]> {
    await this.openCalendar();
    return this.calendarPanelLabels()
      .allTextContents()
      .then((labels) => labels.map((label) => label.trim()).filter(Boolean));
  }

  calendarCell(date: Date): Locator {
    const title = this.formatDate(date);
    return this.visibleCalendar()
      .locator(`td.ant-picker-cell[title="${title}"].ant-picker-cell-in-view`)
      .first();
  }

  async expectDateDisabled(date: Date) {
    await this.openCalendar();
    const cell = this.calendarCell(date);
    await expect(cell).toBeVisible();
    await expect(cell).toHaveClass(/ant-picker-cell-disabled/);
  }

  async selectDateRange(from: Date, to: Date): Promise<RequestQuery> {
    await this.openCalendar();
    const fromCell = this.calendarCell(from);
    await expect(fromCell).toBeVisible();
    await expect(fromCell).not.toHaveClass(/ant-picker-cell-disabled/);
    await fromCell.click();

    const toCell = this.calendarCell(to);
    await expect(toCell).toBeVisible();
    await expect(toCell).not.toHaveClass(/ant-picker-cell-disabled/);
    const requestPromise = this.waitForSubmissionRequest({ hasDates: true });
    await toCell.click();
    const request = await requestPromise;
    await this.waitForTableIdle();
    return this.queryFromRequest(request);
  }

  async clearDateRange(): Promise<RequestQuery> {
    const requestPromise = this.waitForSubmissionRequest({
      withoutDates: true,
    });
    await this.rangePicker().hover();
    await expect(this.rangeClearButton()).toBeVisible();
    await this.rangeClearButton().click();
    const request = await requestPromise;
    await this.waitForTableIdle();
    await expect(this.fromDateInput()).toHaveValue("");
    await expect(this.toDateInput()).toHaveValue("");
    return this.queryFromRequest(request);
  }

  async searchSubmittedBy(fullName: string): Promise<RequestQuery> {
    await this.submittedByInput().fill(fullName);
    const requestPromise = this.waitForSubmissionRequest({
      submittedByName: fullName,
    });
    await this.submittedByInput().press("Enter");
    const request = await requestPromise;
    await this.waitForTableIdle();
    return this.queryFromRequest(request);
  }

  async clearSubmittedBy(): Promise<RequestQuery> {
    const requestPromise = this.waitForSubmissionRequest({
      submittedByName: null,
    });
    await this.submittedByInput().fill("");
    const request = await requestPromise;
    await this.waitForTableIdle();
    return this.queryFromRequest(request);
  }

  async getTableRows(): Promise<SubmissionTableRow[]> {
    const rows = this.tableRows();
    const count = await rows.count();
    const values: SubmissionTableRow[] = [];
    for (let index = 0; index < count; index++) {
      const row = rows.nth(index);
      const cells = row.locator("td");
      if ((await cells.count()) < 4) {
        continue;
      }
      values.push({
        formName: (await cells.nth(0).innerText()).trim(),
        submittedBy: (await cells.nth(1).innerText()).trim(),
        groupName: (await cells.nth(2).innerText()).trim(),
        dateCreated: (await cells.nth(3).innerText()).trim(),
      });
    }
    return values;
  }

  async expectNoData() {
    await expect(this.tableRows()).toHaveCount(0);
    await expect(this.noData()).toBeVisible();
  }

  async clickExportWithoutForm(): Promise<boolean> {
    const exportRequest = this.page
      .waitForRequest((request) => this.isExportRequest(request), {
        timeout: 1_500,
      })
      .then(() => true)
      .catch(() => false);
    await expect(this.exportButton()).toBeEnabled({ timeout: 15_000 });
    await this.exportButton().click();
    await expect(this.toast(FORM_SUBMISSIONS.exportWarning)).toBeVisible();
    return exportRequest;
  }

  async downloadExport(outputPath: string): Promise<ExportDownload | null> {
    const downloadPromise = this.page
      .waitForEvent("download", { timeout: 30_000 })
      .catch(() => null);
    const responsePromise = this.page
      .waitForResponse(
        (response) =>
          this.isExportRequest(response.request()) && response.ok(),
        { timeout: 30_000 },
      )
      .catch(() => null);

    await expect(this.exportButton()).toBeEnabled({ timeout: 15_000 });
    await this.exportButton().click();
    const [download, response] = await Promise.all([
      downloadPromise,
      responsePromise,
    ]);
    if (!response) {
      return null;
    }

    const request = response.request();
    if (download) {
      const filename = download.suggestedFilename();
      await download.saveAs(outputPath);
      return { download, request, filename };
    }

    const disposition = response.headers()["content-disposition"] ?? "";
    const filename =
      disposition.match(/filename="?([^";]+)"?/i)?.[1] ?? "submissions.csv";
    await writeFile(outputPath, await response.body());
    return {
      download: null as unknown as Download,
      request,
      filename,
    };
  }

  queryFromRequest(request: Request): RequestQuery {
    return Object.fromEntries(new URL(request.url()).searchParams.entries());
  }

  exportQuery(result: ExportDownload): RequestQuery {
    return this.queryFromRequest(result.request);
  }

  private waitForFormNamesResponse(): Promise<Response | null> {
    return this.page
      .waitForResponse(
        (response) =>
          response.request().method() === "GET" &&
          new URL(response.url()).pathname.includes(
            FORM_SUBMISSIONS.formNamesApi,
          ),
        { timeout: 30_000 },
      )
      .catch(() => null);
  }

  private waitForSubmissionRequest(
    options: SubmissionRequestOptions,
  ): Promise<Request> {
    return this.page.waitForRequest(
      (request) => {
        if (!this.isSubmissionsRequest(request)) {
          return false;
        }
        const params = new URL(request.url()).searchParams;
        if (
          options.submittedByName !== undefined &&
          (options.submittedByName === null
            ? params.has("submittedByName")
            : params.get("submittedByName") !== options.submittedByName)
        ) {
          return false;
        }
        if (
          options.formName !== undefined &&
          (options.formName === null
            ? params.has("formName")
            : params.get("formName") !== options.formName)
        ) {
          return false;
        }
        if (
          options.hasDates &&
          (!params.has("fromDate") || !params.has("toDate"))
        ) {
          return false;
        }
        if (
          options.withoutDates &&
          (params.has("fromDate") || params.has("toDate"))
        ) {
          return false;
        }
        return true;
      },
      { timeout: 30_000 },
    );
  }

  private isSubmissionsRequest(request: Request): boolean {
    const pathname = new URL(request.url()).pathname.replace(/\/$/, "");
    return (
      request.method() === "GET" &&
      pathname.endsWith(`/${FORM_SUBMISSIONS.submissionsApi}`) &&
      !pathname.endsWith(`/${FORM_SUBMISSIONS.exportApi}`)
    );
  }

  private isExportRequest(request: Request): boolean {
    return (
      request.method() === "GET" &&
      new URL(request.url()).pathname
        .replace(/\/$/, "")
        .endsWith(`/${FORM_SUBMISSIONS.exportApi}`)
    );
  }

  private async waitForTableIdle() {
    await this.page
      .locator(".ant-table-wrapper .ant-spin-spinning")
      .waitFor({ state: "hidden", timeout: 30_000 })
      .catch(() => undefined);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private async extractFormNames(response: Response): Promise<string[]> {
    if (!response.ok()) {
      return [];
    }

    const body: unknown = await response.json().catch(() => null);
    const findNames = (value: unknown, depth = 0): string[] => {
      if (depth > 5) {
        return [];
      }
      if (Array.isArray(value)) {
        if (value.every((item) => typeof item === "string")) {
          return value.map((item) => item.trim()).filter(Boolean);
        }
        for (const item of value) {
          const names = findNames(item, depth + 1);
          if (names.length) {
            return names;
          }
        }
      } else if (value && typeof value === "object") {
        for (const nested of Object.values(value as Record<string, unknown>)) {
          const names = findNames(nested, depth + 1);
          if (names.length) {
            return names;
          }
        }
      }
      return [];
    };

    return findNames(body);
  }
}
