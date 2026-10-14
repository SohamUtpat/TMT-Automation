import { readFile } from "node:fs/promises";
import { expect, test } from "../fixtures/forms.fixture";
import {
  FORM_SUBMISSIONS,
  type ExportDownload,
  type FormSubmissionsPage,
  type SubmissionTableRow,
} from "../pages/FormSubmissionsPage";
import type { TestInfo } from "@playwright/test";
import * as XLSX from "xlsx";

const INVALID_SUBMITTED_BY = `No-Matching-Submitter-${Date.now()}`;
const EXPECTED_EXPORT_COLUMNS = [
  ["formname", "form"],
  ["submittedby", "submitter", "submittedbyname"],
  ["groupname", "group"],
  ["datecreated", "submissiondate", "submittedon"],
] as const;

type CsvData = {
  headers: string[];
  rows: string[][];
};

type SelectedExport = {
  uiRow: SubmissionTableRow;
  result: ExportDownload;
  csv: CsvData;
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/^\uFEFF/, "")
    .replace(/[^a-z0-9]/g, "");
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function nextMonthStart(): Date {
  const date = startOfToday();
  date.setMonth(date.getMonth() + 1, 1);
  return date;
}

function monthLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
}

function parseUiDate(value: string): Date | null {
  const trimmed = value.trim();
  // Listing dates use en-GB DD/MM/YYYY (see formatLocalizedDate).
  const dmy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const date = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(`${trimmed} 00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function findColumn(headers: string[], aliases: readonly string[]): number {
  const normalizedHeaders = headers.map(normalize);
  return normalizedHeaders.findIndex((header) =>
    aliases.some((alias) => header === normalize(alias)),
  );
}

async function parseCsv(path: string): Promise<CsvData> {
  const buffer = await readFile(path);
  const workbook = XLSX.read(buffer, { type: "buffer", codepage: 65001 });
  const sheetName = workbook.SheetNames[0];
  expect(
    sheetName,
    "CSV export should contain one readable worksheet",
  ).toBeTruthy();
  const rows = XLSX.utils.sheet_to_json<(string | number | boolean)[]>(
    workbook.Sheets[sheetName],
    {
      header: 1,
      defval: "",
      raw: false,
      blankrows: false,
    },
  );

  const normalizedRows = rows.map((row) =>
    row.map((cell) => String(cell).trim()),
  );
  return {
    headers: normalizedRows[0] ?? [],
    rows: normalizedRows.slice(1).filter((row) => row.some(Boolean)),
  };
}

async function requireFirstSubmission(
  formSubmissionsPage: FormSubmissionsPage,
  reason: string,
): Promise<SubmissionTableRow> {
  const row = (await formSubmissionsPage.getTableRows())[0];
  expect(row, reason).toBeTruthy();
  return row!;
}

async function selectSubmissionForm(
  formSubmissionsPage: FormSubmissionsPage,
  reason: string,
): Promise<SubmissionTableRow> {
  const initialRow = await requireFirstSubmission(formSubmissionsPage, reason);
  await formSubmissionsPage.selectForm(initialRow.formName);
  const filteredRows = await formSubmissionsPage.getTableRows();
  expect(
    filteredRows.length,
    `Form "${initialRow.formName}" has no matching live submissions after selection.`,
  ).toBeGreaterThan(0);
  return filteredRows[0];
}

async function prepareSelectedExport(
  formSubmissionsPage: FormSubmissionsPage,
  testInfo: TestInfo,
): Promise<SelectedExport> {
  const uiRow = await selectSubmissionForm(
    formSubmissionsPage,
    "No live submissions are available to identify an exportable form.",
  );
  const outputPath = testInfo.outputPath(`form-submissions-${Date.now()}.csv`);
  const result = await formSubmissionsPage.downloadExport(outputPath);
  expect(
    result,
    `Selected form "${uiRow.formName}" did not produce a successful live CSV download.`,
  ).toBeTruthy();
  return { uiRow, result: result!, csv: await parseCsv(outputPath) };
}

function expectRequiredExportColumns(headers: string[]) {
  const normalizedHeaders = headers.map(normalize);
  for (const aliases of EXPECTED_EXPORT_COLUMNS) {
    expect(
      normalizedHeaders.some((header) =>
        aliases.some((alias) => header === normalize(alias)),
      ),
      `Expected one export column matching: ${aliases.join(", ")}. Live headers: ${headers.join(", ")}`,
    ).toBe(true);
  }
}

test("TC_AP_648 - Verify Select Form placeholder is shown by default", async ({
  formSubmissionsPage,
}) => {
  await expect(formSubmissionsPage.heading()).toBeVisible();
  await expect(formSubmissionsPage.formSelect()).toBeVisible();
  await expect(formSubmissionsPage.selectedFormLabel()).toHaveText(
    FORM_SUBMISSIONS.selectFormPlaceholder,
  );
  expect(await formSubmissionsPage.hasSelectedForm()).toBe(false);
});

test("TC_AP_649 - Verify selecting a form filters submissions", async ({
  formSubmissionsPage,
}) => {
  const row = await selectSubmissionForm(
    formSubmissionsPage,
    "No live submissions are available to verify form filtering.",
  );
  const filteredRows = await formSubmissionsPage.getTableRows();
  expect(filteredRows.length).toBeGreaterThan(0);
  expect(filteredRows.every((item) => item.formName === row.formName)).toBe(
    true,
  );
});

test("TC_AP_650 - Verify all forms are shown in a scrollable dropdown", async ({
  formSubmissionsPage,
}) => {
  const liveNames = formSubmissionsPage.getLoadedFormNames();
  expect(
    liveNames.length,
    "Fewer than two live forms are available in the form-names API.",
  ).toBeGreaterThanOrEqual(2);

  const defaultOptions = await formSubmissionsPage.searchFormOptions("");
  for (const formName of new Set(liveNames)) {
    expect(defaultOptions).toContain(formName);
  }

  // Scrollability only applies when the list overflows the picker panel.
  if (liveNames.length >= 8) {
    expect(
      await formSubmissionsPage.dropdownHasScrollableList(),
      `The ${liveNames.length} live forms do not overflow the dropdown, so scrolling cannot be verified.`,
    ).toBe(true);
  }

  for (const formName of new Set(liveNames)) {
    const matchingOptions =
      await formSubmissionsPage.searchFormOptions(formName);
    expect(matchingOptions).toContain(formName);
  }
});

test("TC_AP_652 - Verify calendar opens from both date inputs", async ({
  formSubmissionsPage,
}) => {
  await formSubmissionsPage.openCalendar("from");
  await expect(formSubmissionsPage.visibleCalendar()).toBeVisible();
  await formSubmissionsPage.closeCalendar();

  await formSubmissionsPage.openCalendar("to");
  await expect(formSubmissionsPage.visibleCalendar()).toBeVisible();
});

test("TC_AP_653 - Verify current and next month are displayed", async ({
  formSubmissionsPage,
}) => {
  const labels = await formSubmissionsPage.getCalendarPanelLabels();
  expect(labels).toHaveLength(2);

  const current = startOfToday();
  const next = nextMonthStart();
  expect(normalize(labels[0])).toBe(normalize(monthLabel(current)));
  expect(normalize(labels[1])).toBe(normalize(monthLabel(next)));
});

test("TC_AP_654 - Verify future dates in next month are disabled", async ({
  formSubmissionsPage,
}) => {
  const futureDate = nextMonthStart();
  await formSubmissionsPage.expectDateDisabled(futureDate);
});

test("TC_AP_655 - Verify submissions are filtered by From and To dates", async ({
  formSubmissionsPage,
}) => {
  const today = startOfToday();
  const query = await formSubmissionsPage.selectDateRange(today, today);
  expect(query.fromDate).toBeTruthy();
  expect(query.toDate).toBeTruthy();

  const rows = await formSubmissionsPage.getTableRows();
  expect(
    rows.length,
    "No live submissions exist for today to verify date-filtered rows.",
  ).toBeGreaterThan(0);
  expect(
    rows.every((row) => {
      const date = parseUiDate(row.dateCreated);
      return date ? formatLocalDate(date) === formatLocalDate(today) : false;
    }),
  ).toBe(true);
});

test("TC_AP_656 - Verify clearing date range resets to the current month", async ({
  formSubmissionsPage,
}) => {
  const today = startOfToday();
  await formSubmissionsPage.selectDateRange(today, today);
  const query = await formSubmissionsPage.clearDateRange();
  expect(query).not.toHaveProperty("fromDate");
  expect(query).not.toHaveProperty("toDate");

  const labels = await formSubmissionsPage.getCalendarPanelLabels();
  expect(normalize(labels[0])).toBe(normalize(monthLabel(today)));
});

test("TC_AP_657 - Verify filtering by a full submitted name", async ({
  formSubmissionsPage,
}) => {
  const initial = await requireFirstSubmission(
    formSubmissionsPage,
    "No live submissions are available to obtain a complete Submitted By name.",
  );
  expect(
    initial.submittedBy,
    "The available live submission has an empty Submitted By value.",
  ).toBeTruthy();

  const query = await formSubmissionsPage.searchSubmittedBy(
    initial.submittedBy,
  );
  expect(query.submittedByName).toBe(initial.submittedBy);
  const rows = await formSubmissionsPage.getTableRows();
  expect(
    rows.length,
    `No live submissions match the full Submitted By name "${initial.submittedBy}".`,
  ).toBeGreaterThan(0);
  expect(rows.every((row) => row.submittedBy === initial.submittedBy)).toBe(
    true,
  );
});

test("TC_AP_658 - Verify behavior for an unmatched submitted name", async ({
  formSubmissionsPage,
}) => {
  const query =
    await formSubmissionsPage.searchSubmittedBy(INVALID_SUBMITTED_BY);
  expect(query.submittedByName).toBe(INVALID_SUBMITTED_BY);
  await formSubmissionsPage.expectNoData();
});

test("TC_AP_659 - Verify clearing Submitted By resets submissions", async ({
  formSubmissionsPage,
}) => {
  const before = await formSubmissionsPage.getTableRows();
  await formSubmissionsPage.searchSubmittedBy(INVALID_SUBMITTED_BY);
  await formSubmissionsPage.expectNoData();

  const query = await formSubmissionsPage.clearSubmittedBy();
  expect(query).not.toHaveProperty("submittedByName");
  await expect(formSubmissionsPage.submittedByInput()).toHaveValue("");
  expect(await formSubmissionsPage.getTableRows()).toEqual(before);
});

test("TC_AP_660 - Verify export works only after selecting a form", async ({
  formSubmissionsPage,
}, testInfo) => {
  expect(await formSubmissionsPage.clickExportWithoutForm()).toBe(false);
  const exported = await prepareSelectedExport(formSubmissionsPage, testInfo);
  // Server Content-Disposition may be generic; client fallback uses form-submissions=timestamp.
  expect(exported.result.filename).toMatch(
    /(-submissions=\d{8}_\d{6}|submissions)\.csv$/i,
  );
});

test("TC_AP_661 - Verify export contains only the selected form", async ({
  formSubmissionsPage,
}, testInfo) => {
  const exported = await prepareSelectedExport(formSubmissionsPage, testInfo);
  const query = formSubmissionsPage.exportQuery(exported.result);
  expect(query.formId).toBeTruthy();

  const formColumn = findColumn(exported.csv.headers, ["form name", "form"]);
  if (formColumn >= 0 && exported.csv.rows.length > 0) {
    expect(
      exported.csv.rows.every(
        (row) => row[formColumn] === exported.uiRow.formName,
      ),
    ).toBe(true);
  }
});

test("TC_AP_662 - Verify Export downloads a file successfully", async ({
  formSubmissionsPage,
}, testInfo) => {
  const exported = await prepareSelectedExport(formSubmissionsPage, testInfo);
  expect(exported.result.filename).toMatch(/\.csv$/i);
  expect(exported.csv.headers.length).toBeGreaterThan(0);
});

test("TC_AP_663 - Verify exported file uses CSV format", async ({
  formSubmissionsPage,
}, testInfo) => {
  const exported = await prepareSelectedExport(formSubmissionsPage, testInfo);
  expect(exported.result.filename.toLowerCase()).toMatch(/\.csv$/);
  expect(exported.csv.headers.length).toBeGreaterThan(0);
});

test("TC_AP_664 - Verify required columns exist in exported CSV", async ({
  formSubmissionsPage,
}, testInfo) => {
  const exported = await prepareSelectedExport(formSubmissionsPage, testInfo);
  expectRequiredExportColumns(exported.csv.headers);
});

test("TC_AP_665 - Verify exported data matches the submissions table", async ({
  formSubmissionsPage,
}, testInfo) => {
  const exported = await prepareSelectedExport(formSubmissionsPage, testInfo);
  expect(
    exported.csv.rows.length,
    "The selected live export contains headers but no data rows.",
  ).toBeGreaterThan(0);

  const formColumn = findColumn(exported.csv.headers, ["form name", "form"]);
  const submittedByColumn = findColumn(exported.csv.headers, [
    "submitted by",
    "submitter",
    "submitted by name",
  ]);
  const groupColumn = findColumn(exported.csv.headers, ["group name", "group"]);
  expect(
    formColumn >= 0 && submittedByColumn >= 0 && groupColumn >= 0,
    `Live CSV lacks comparable form/submitted-by/group columns: ${exported.csv.headers.join(", ")}`,
  ).toBe(true);

  expect(
    exported.csv.rows.some(
      (row) =>
        row[formColumn] === exported.uiRow.formName &&
        row[submittedByColumn] === exported.uiRow.submittedBy &&
        row[groupColumn] === exported.uiRow.groupName,
    ),
  ).toBe(true);
});

test("TC_AP_666 - Verify export respects date range filters", async ({
  formSubmissionsPage,
}, testInfo) => {
  await selectSubmissionForm(
    formSubmissionsPage,
    "No live submissions are available to select an exportable form.",
  );
  const today = startOfToday();
  await formSubmissionsPage.selectDateRange(today, today);
  const filteredRows = await formSubmissionsPage.getTableRows();
  expect(
    filteredRows.length,
    "No selected-form submissions exist today for date export coverage.",
  ).toBeGreaterThan(0);

  const outputPath = testInfo.outputPath(`date-filtered-${Date.now()}.csv`);
  const result = await formSubmissionsPage.downloadExport(outputPath);
  expect(
    result,
    "The selected live form did not produce a date-filtered CSV download.",
  ).toBeTruthy();
  const query = formSubmissionsPage.exportQuery(result!);
  expect(query.fromDate).toBe(formatLocalDate(today));
  expect(query.toDate).toBe(formatLocalDate(today));

  const csv = await parseCsv(outputPath);
  const dateColumn = findColumn(csv.headers, [
    "date created",
    "submission date",
    "submitted on",
  ]);
  expect(
    dateColumn,
    `Live CSV has no comparable date column: ${csv.headers.join(", ")}`,
  ).toBeGreaterThanOrEqual(0);
  expect(
    csv.rows.every((row) => {
      const date = new Date(row[dateColumn]);
      return (
        !Number.isNaN(date.getTime()) &&
        formatLocalDate(date) === formatLocalDate(today)
      );
    }),
  ).toBe(true);
});

test("TC_AP_667 - Verify export respects Submitted By filter", async ({
  formSubmissionsPage,
}, testInfo) => {
  const selectedRow = await selectSubmissionForm(
    formSubmissionsPage,
    "No live submissions are available to select an exportable form.",
  );
  expect(
    selectedRow.submittedBy,
    "Selected live submission has an empty Submitted By value.",
  ).toBeTruthy();
  await formSubmissionsPage.searchSubmittedBy(selectedRow.submittedBy);
  expect(
    (await formSubmissionsPage.getTableRows()).length,
    `No selected-form submissions match "${selectedRow.submittedBy}".`,
  ).toBeGreaterThan(0);

  const outputPath = testInfo.outputPath(
    `submitter-filtered-${Date.now()}.csv`,
  );
  const result = await formSubmissionsPage.downloadExport(outputPath);
  expect(
    result,
    "The selected live form did not produce a Submitted By-filtered CSV download.",
  ).toBeTruthy();
  const query = formSubmissionsPage.exportQuery(result!);
  expect(query.submittedByName).toBe(selectedRow.submittedBy);

  const csv = await parseCsv(outputPath);
  const submittedByColumn = findColumn(csv.headers, [
    "submitted by",
    "submitter",
    "submitted by name",
  ]);
  expect(
    submittedByColumn,
    `Live CSV has no comparable Submitted By column: ${csv.headers.join(", ")}`,
  ).toBeGreaterThanOrEqual(0);
  expect(csv.rows.length).toBeGreaterThan(0);
  expect(
    csv.rows.every((row) => row[submittedByColumn] === selectedRow.submittedBy),
  ).toBe(true);
});
