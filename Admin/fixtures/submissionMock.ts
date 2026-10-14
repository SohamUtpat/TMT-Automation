import type { Page } from "@playwright/test";

export const MOCK_SUBMISSION_FORM = "Automation Submission Form";
export const MOCK_SUBMISSION_FORM_ALT = "Automation Submission Form B";
export const MOCK_SUBMITTED_BY = "Automation User";
export const MOCK_GROUP_NAME = "Automation Group";

type MockSubmission = {
  id: string;
  formId: string;
  formName: string;
  groupId: string;
  groupName: string;
  submittedBy: string;
  submittedByName: string;
  responses: [];
  dateCreated: number;
  dateUpdated: number;
  isDeleted: boolean;
  deletedBy: null;
  deletedAt: null;
};

function startOfTodayTimestamp(): number {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  return date.getTime();
}

function buildMockSubmissions(): MockSubmission[] {
  const timestamp = startOfTodayTimestamp();
  return [
    {
      id: "mock-submission-1",
      formId: "mock-form-id-1",
      formName: MOCK_SUBMISSION_FORM,
      groupId: "mock-group-id-1",
      groupName: MOCK_GROUP_NAME,
      submittedBy: "mock-user-id-1",
      submittedByName: MOCK_SUBMITTED_BY,
      responses: [],
      dateCreated: timestamp,
      dateUpdated: timestamp,
      isDeleted: false,
      deletedBy: null,
      deletedAt: null,
    },
    {
      id: "mock-submission-2",
      formId: "mock-form-id-2",
      formName: MOCK_SUBMISSION_FORM_ALT,
      groupId: "mock-group-id-2",
      groupName: "Automation Group B",
      submittedBy: "mock-user-id-2",
      submittedByName: "Automation User B",
      responses: [],
      dateCreated: timestamp,
      dateUpdated: timestamp,
      isDeleted: false,
      deletedBy: null,
      deletedAt: null,
    },
  ];
}

function filterSubmissions(
  submissions: MockSubmission[],
  params: URLSearchParams,
): MockSubmission[] {
  let filtered = [...submissions];

  const formId = params.get("formId");
  if (formId) {
    filtered = filtered.filter((row) => row.formId === formId);
  }

  const formName = params.get("formName");
  if (formName) {
    filtered = filtered.filter((row) => row.formName === formName);
  }

  const submittedByName = params.get("submittedByName");
  if (submittedByName) {
    filtered = filtered.filter(
      (row) => row.submittedByName === submittedByName,
    );
  }

  const fromDate = params.get("fromDate");
  const toDate = params.get("toDate");
  if (fromDate && toDate) {
    const from = new Date(fromDate).getTime();
    const to = new Date(toDate).getTime();
    filtered = filtered.filter(
      (row) => row.dateCreated >= from && row.dateCreated <= to + 86_400_000,
    );
  }

  return filtered;
}

function buildExportCsv(submissions: MockSubmission[]): string {
  const header = "Form Name,Submitted By,Group Name,Date Created";
  const rows = submissions.map((row) => {
    const date = new Date(row.dateCreated).toLocaleDateString("en-US");
    return `${row.formName},${row.submittedByName},${row.groupName},${date}`;
  });
  return [header, ...rows].join("\n");
}

function buildMockForms() {
  return [
    {
      id: "mock-form-id-1",
      name: MOCK_SUBMISSION_FORM,
      description: "Automation mock form",
    },
    {
      id: "mock-form-id-2",
      name: MOCK_SUBMISSION_FORM_ALT,
      description: "Automation mock form B",
    },
  ];
}

function buildFormsListResponse(search?: string | null) {
  const needle = search?.trim().toLowerCase() ?? "";
  const forms = needle
    ? buildMockForms().filter(
        (form) =>
          form.name.toLowerCase().includes(needle) ||
          form.description.toLowerCase().includes(needle),
      )
    : buildMockForms();

  return {
    data: {
      forms,
      count: forms.length,
      total: forms.length,
    },
    message: "OK",
  };
}

const ROUTE_FORM_NAMES = "**/form/list/names**";
const ROUTE_FORM_LIST = "**/form/get/forms**";
const ROUTE_SUBMISSIONS = "**/forms/submissions**";

function isSubmissionExportUrl(url: URL): boolean {
  return (
    url.pathname.replace(/\/$/, "").endsWith("/forms/submissions/export")
  );
}

/** Remove local submission mocks so later Forms list tests use the real API. */
export async function uninstallLocalSubmissionMocks(page: Page): Promise<void> {
  for (const pattern of [ROUTE_FORM_NAMES, ROUTE_FORM_LIST, ROUTE_SUBMISSIONS]) {
    await page.unroute(pattern).catch(() => undefined);
  }
}

export async function installLocalSubmissionMocks(page: Page): Promise<boolean> {
  // Avoid stacking handlers when navigate() runs again on the shared worker page.
  await uninstallLocalSubmissionMocks(page);

  const submissions = buildMockSubmissions();
  const formNames = [
    ...submissions.map((row) => row.formName),
    ...Array.from({ length: 12 }, (_, index) => `Automation Form ${index + 3}`),
  ];

  await page.route(ROUTE_FORM_NAMES, async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: 0,
        data: { formNames },
        message: "OK",
      }),
    });
  });

  await page.route(ROUTE_FORM_LIST, async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }

    const search = new URL(route.request().url()).searchParams.get("search");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: 0,
        ...buildFormsListResponse(search),
      }),
    });
  });

  await page.route(ROUTE_SUBMISSIONS, async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }

    const url = new URL(route.request().url());
    const params = url.searchParams;
    const filtered = filterSubmissions(submissions, params);

    if (isSubmissionExportUrl(url)) {
      await route.fulfill({
        status: 200,
        contentType: "text/csv; charset=utf-8",
        headers: {
          "Content-Disposition": 'attachment; filename="submissions.csv"',
        },
        body: buildExportCsv(filtered),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: 0,
        data: {
          submissions: filtered,
          count: filtered.length,
          total: filtered.length,
        },
        message: "OK",
      }),
    });
  });

  return true;
}
