import { test as base, type BrowserContext, type Page } from "@playwright/test";
import path from "path";
import { FormBuilderPage } from "../pages/FormBuilderPage";
import { FormSubmissionsPage } from "../pages/FormSubmissionsPage";
import { FormsPage } from "../pages/FormsPage";

const authFile = path.join(__dirname, "../../playwright/.auth/admin.json");

type FormsFixtures = {
  formBuilderPage: FormBuilderPage;
  formSubmissionsPage: FormSubmissionsPage;
  formsPage: FormsPage;
};

type WorkerFixtures = {
  workerContext: BrowserContext;
  workerPage: Page;
};

export const test = base.extend<FormsFixtures, WorkerFixtures>({
  workerContext: [
    async ({ browser }, use) => {
      const context = await browser.newContext({ storageState: authFile });
      await use(context);
      await context.close();
    },
    { scope: "worker" },
  ],

  workerPage: [
    async ({ workerContext }, use) => {
      const page = await workerContext.newPage();
      const formsPage = new FormsPage(page);
      await formsPage.navigateToForms();
      await use(page);
    },
    { scope: "worker" },
  ],

  page: async ({ workerPage }, use) => {
    await use(workerPage);
  },

  formsPage: async ({ workerPage }, use) => {
    const formsPage = new FormsPage(workerPage);
    await formsPage.ensureFormsReady();
    await use(formsPage);
    await formsPage.resetAfterTest();
  },

  formBuilderPage: async ({ workerPage }, use) => {
    const formBuilderPage = new FormBuilderPage(workerPage);
    await formBuilderPage.navigateToBuilder();
    try {
      await use(formBuilderPage);
    } finally {
      await formBuilderPage.resetAfterTest();
    }
  },

  formSubmissionsPage: async ({ workerPage }, use) => {
    const formSubmissionsPage = new FormSubmissionsPage(workerPage);
    await formSubmissionsPage.navigate();
    try {
      await use(formSubmissionsPage);
    } finally {
      await formSubmissionsPage.resetAfterTest();
    }
  },
});

export { expect } from "@playwright/test";
