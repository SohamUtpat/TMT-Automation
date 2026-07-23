import {
  expect,
  type Download,
  type Locator,
  type Page,
  type Request,
  type Response,
} from "@playwright/test";
import { ensureAuthenticated as restoreSession } from "../utils/ensureAuthenticated";

export const FORM_SUBMISSIONS = {
  path: "/form-submissions",
  title: "Form Submissions",
  allForms: "All Forms",
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
    this.page.locator(".form-submissions-filters-group .ant-select").first();

  formCombobox = () => this.formSelect().getByRole("combobox");

  selectedFormLabel = () =>
    this.formSelect().locator(".ant-select-selection-item");

  formClearButton = () => this.formSelect().locator(".ant-select-clear");

  visibleFormDropdown = () =>
    this.page
      .locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden)")
      .filter({
        has: this.page.locator(".ant-select-item-option"),
      });

  formOptions = () =>
    this.visibleFormDropdown().locator(".ant-select-item-option");

  virtualListHolder = () =>
    this.visibleFormDropdown().locator(".rc-virtual-list-holder");

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
    const holder = this.virtualListHolder();
    const labels = new Set<string>();

    if (!(await holder.isVisible().catch(() => false))) {
      return this.getVisibleFormOptionLabels();
    }

    let previousTop = -1;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (!(await holder.isVisible().catch(() => false))) {
        await this.openFormDropdown();
        if (!(await holder.isVisible().catch(() => false))) {
          break;
        }
      }
      for (const label of await this.formOptions().allTextContents()) {
        const normalized = label.trim();
        if (normalized) {
          labels.add(normalized);
        }
      }

      const metrics = await holder.evaluate((element) => ({
        top: element.scrollTop,
        nextTop: Math.min(
          element.scrollTop + Math.max(element.clientHeight - 20, 1),
          element.scrollHeight - element.clientHeight,
        ),
        atBottom:
          element.scrollTop + element.clientHeight >= element.scrollHeight - 1,
      }));
      if (metrics.atBottom || metrics.nextTop === previousTop) {
        break;
      }
      previousTop = metrics.nextTop;
      await holder.evaluate((element, top) => {
        element.scrollTop = top;
        element.dispatchEvent(new Event("scroll", { bubbles: true }));
      }, metrics.nextTop);
      await this.page.waitForTimeout(50);
    }

    return [...labels];
  }

  getLoadedFormNames(): string[] {
    return [...this.formNamesFromApi];
  }

  async dropdownHasScrollableList(): Promise<boolean> {
    await this.openFormDropdown();
    const holder = this.virtualListHolder();
    if (!(await holder.isVisible().catch(() => false))) {
      return false;
    }
    return holder.evaluate(
      (element) => element.scrollHeight > element.clientHeight + 1,
    );
  }

  async searchFormOptions(term: string): Promise<string[]> {
    await this.openFormDropdown();
    await this.formCombobox().fill(term);
    await this.page.waitForTimeout(100);
    const holder = this.virtualListHolder();
    if (await holder.isVisible().catch(() => false)) {
      await holder.evaluate((element) => {
        element.scrollTop = 0;
        element.dispatchEvent(new Event("scroll", { bubbles: true }));
      });
    }
    return this.getAllFormOptionLabels();
  }

  async selectForm(formName: string): Promise<RequestQuery> {
    await this.openFormDropdown();
    await this.formCombobox().fill(formName);
    const target = this.visibleFormDropdown()
      .getByText(formName, { exact: true })
      .first();
    await expect(target).toBeVisible({ timeout: 15_000 });

    const requestPromise = this.waitForSubmissionRequest({ formName });
    await target.click();
    const request = await requestPromise;
    await this.waitForTableIdle();
    await expect(this.selectedFormLabel()).toHaveText(formName);
    return this.queryFromRequest(request);
  }

  async selectFirstSpecificForm(): Promise<string | null> {
    const labels = await this.getAllFormOptionLabels();
    await this.closeFormDropdown();
    const formName =
      labels.find((label) => label !== FORM_SUBMISSIONS.allForms) ?? null;
    if (formName) {
      await this.selectForm(formName);
    }
    return formName;
  }

  async clearFormSelection(): Promise<RequestQuery> {
    if ((await this.getSelectedFormLabel()) === FORM_SUBMISSIONS.allForms) {
      return {};
    }
    const requestPromise = this.waitForSubmissionRequest({ formName: null });
    await this.formSelect().hover();
    await expect(this.formClearButton()).toBeVisible();
    await this.formClearButton().click();
    const request = await requestPromise;
    await this.waitForTableIdle();
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
      const cells = rows.nth(index).locator("td");
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
    await this.exportButton().click();
    await expect(this.toast(FORM_SUBMISSIONS.exportWarning)).toBeVisible();
    return exportRequest;
  }

  async downloadExport(outputPath: string): Promise<ExportDownload | null> {
    const downloadPromise = this.page
      .waitForEvent("download", { timeout: 30_000 })
      .catch(() => null);
    const requestPromise = this.page
      .waitForRequest((request) => this.isExportRequest(request), {
        timeout: 30_000,
      })
      .catch(() => null);

    await this.exportButton().click();
    const [download, request] = await Promise.all([
      downloadPromise,
      requestPromise,
    ]);
    if (!download || !request) {
      return null;
    }

    const filename = download.suggestedFilename();
    await download.saveAs(outputPath);
    return { download, request, filename };
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
