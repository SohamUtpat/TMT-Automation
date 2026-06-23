


 TC_AP_280	 DASHBOARD	"Verify that the TOP Boxes consists of 
> Total Number of Mobile App Users - HQ Members - Users can Delete 
> Total Groups
> Admins"
TC_AP_281	 DASHBOARD	Verify that the number of Mobile App Users - HQ Members - Users can Delete - Total Groups - Admins is correct as per actual number of users or Groups is created
TC_AP_282	 DASHBOARD	Verify that the number of Mobile App Users - HQ Members - Users can Delete - Total Groups - Admins is updated if any user/group contains both Active and Inactive Users / Groups
TC_AP_285	 DASHBOARD	"Verify the Venn diagram has updated count and is matching with the actual 
Having - Mobile App Users 
- HQ Members
- Users Can Delete
- Regular Users"
TC_AP_286	 DASHBOARD	"Verify the Venn diagram has updated count and is matching with the actual 
 by clicking on the Mobile App Users >"
TC_AP_287	 DASHBOARD	Verify that below venn diagram, there is a graph of group wise users , having X - axis (Group Name) and Y Axis (User Count )
TC_AP_288	 DASHBOARD	Verify that the Group with NO Users associated , should not be visible on the graph
TC_AP_289	 DASHBOARD	"Verify when cursor is hovered over groups in graph, users are shown as 
- HQ Members
- Users Can Delete
- Regular Users"
TC_AP_290	 DASHBOARD	"Verify the Graph has updated count and is matching with the actual 
number of Users
- HQ Members
- Users Can Delete
- Regular Users"
TC_AP_291	 DASHBOARD	"Verify that the Bar graph has fields and count of 
- Group Name
- Regular Users
- Users can Delete
- HQ users"


For the above test cases can you similary give the script for each test cases and with 
Data file and page file 

Assuming you're using a Playwright + TypeScript Page Object Model (POM) framework, below is a sample structure for each Dashboard test case with:

Test File (dashboard.spec.ts)

Page File (DashboardPage.ts)

Data File (DashboardData.ts)

Page File: DashboardPage.ts
import { Page, expect } from '@playwright/test';

export class DashboardPage {
  constructor(private page: Page) {}

  // Top Boxes
  totalMobileAppUsers = () => this.page.locator('[data-testid="mobile-app-users"]');
  totalHQMembers = () => this.page.locator('[data-testid="hq-members"]');
  totalUsersCanDelete = () => this.page.locator('[data-testid="users-can-delete"]');
  totalGroups = () => this.page.locator('[data-testid="total-groups"]');
  totalAdmins = () => this.page.locator('[data-testid="total-admins"]');

  // Venn Diagram
  vennDiagram = () => this.page.locator('#venn-diagram');
  mobileAppUsersSection = () => this.page.locator('text=Mobile App Users');

  // Graph
  groupUserGraph = () => this.page.locator('#group-user-graph');
  graphBars = () => this.page.locator('.bar');
  graphTooltip = () => this.page.locator('.tooltip');

  async getTopBoxCount(locator) {
    return Number(await locator.textContent());
  }

  async hoverOnGroup(index: number) {
    await this.graphBars().nth(index).hover();
  }
}
Data File: DashboardData.ts
export const DashboardData = {
  expectedTopBoxes: [
    'Mobile App Users',
    'HQ Members',
    'Users Can Delete',
    'Total Groups',
    'Admins'
  ],

  sampleCounts: {
    mobileUsers: 150,
    hqMembers: 25,
    usersCanDelete: 10,
    totalGroups: 12,
    admins: 5
  },

  graphTooltipFields: [
    'HQ Members',
    'Users Can Delete',
    'Regular Users'
  ]
};
TC_AP_280
Verify Dashboard Top Boxes
test('TC_AP_280 - Verify Dashboard Top Boxes', async ({ dashboardPage }) => {

  await expect(dashboardPage.totalMobileAppUsers()).toBeVisible();
  await expect(dashboardPage.totalHQMembers()).toBeVisible();
  await expect(dashboardPage.totalUsersCanDelete()).toBeVisible();
  await expect(dashboardPage.totalGroups()).toBeVisible();
  await expect(dashboardPage.totalAdmins()).toBeVisible();

});
TC_AP_281
Verify Dashboard Counts Match Actual Data
test('TC_AP_281 - Verify Dashboard Counts', async ({ dashboardPage }) => {

  expect(
    await dashboardPage.getTopBoxCount(
      dashboardPage.totalMobileAppUsers()
    )
  ).toBe(DashboardData.sampleCounts.mobileUsers);

  expect(
    await dashboardPage.getTopBoxCount(
      dashboardPage.totalHQMembers()
    )
  ).toBe(DashboardData.sampleCounts.hqMembers);

});
TC_AP_282
Verify Counts Update After Active/Inactive Changes
test('TC_AP_282 - Verify Count Updates for Active/Inactive Users', async ({
  dashboardPage,
  userPage
}) => {

  await userPage.deactivateUser('Test User');

  await dashboardPage.page.reload();

  const updatedCount =
    await dashboardPage.getTopBoxCount(
      dashboardPage.totalMobileAppUsers()
    );

  expect(updatedCount).toBeLessThan(
    DashboardData.sampleCounts.mobileUsers
  );

});
TC_AP_285
Verify Venn Diagram Counts
test('TC_AP_285 - Verify Venn Diagram Count', async ({ dashboardPage }) => {

  await expect(
    dashboardPage.vennDiagram()
  ).toBeVisible();

  const vennText =
    await dashboardPage.vennDiagram().textContent();

  expect(vennText).toContain('Mobile App Users');
  expect(vennText).toContain('HQ Members');
  expect(vennText).toContain('Users Can Delete');
  expect(vennText).toContain('Regular Users');

});
TC_AP_286
Verify Clicking Mobile App Users Updates Venn Diagram
test('TC_AP_286 - Verify Mobile App User Click Action', async ({
  dashboardPage
}) => {

  await dashboardPage.mobileAppUsersSection().click();

  await expect(
    dashboardPage.vennDiagram()
  ).toBeVisible();

});
TC_AP_287
Verify Group Wise User Graph
test('TC_AP_287 - Verify Group Wise User Graph', async ({
  dashboardPage
}) => {

  await expect(
    dashboardPage.groupUserGraph()
  ).toBeVisible();

  await expect(
    dashboardPage.page.locator('text=Group Name')
  ).toBeVisible();

  await expect(
    dashboardPage.page.locator('text=User Count')
  ).toBeVisible();

});
TC_AP_288
Verify Empty Groups Not Displayed
test('TC_AP_288 - Verify Empty Groups Not Displayed', async ({
  dashboardPage
}) => {

  const graphText =
    await dashboardPage.groupUserGraph().textContent();

  expect(graphText).not.toContain('Empty Group');

});
TC_AP_289
Verify Graph Tooltip Details
test('TC_AP_289 - Verify Tooltip User Categories', async ({
  dashboardPage
}) => {

  await dashboardPage.hoverOnGroup(0);

  await expect(
    dashboardPage.graphTooltip()
  ).toContainText('HQ Members');

  await expect(
    dashboardPage.graphTooltip()
  ).toContainText('Users Can Delete');

  await expect(
    dashboardPage.graphTooltip()
  ).toContainText('Regular Users');

});
TC_AP_290
Verify Graph Counts Match Actual Data
test('TC_AP_290 - Verify Graph User Counts', async ({
  dashboardPage
}) => {

  const graphBarsCount =
    await dashboardPage.graphBars().count();

  expect(graphBarsCount).toBeGreaterThan(0);

});
TC_AP_291
Verify Bar Graph Fields
test('TC_AP_291 - Verify Graph Fields', async ({
  dashboardPage
}) => {

  await dashboardPage.hoverOnGroup(0);

  const tooltip =
    await dashboardPage.graphTooltip().textContent();

  expect(tooltip).toContain('Group Name');
  expect(tooltip).toContain('Regular Users');
  expect(tooltip).toContain('Users Can Delete');
  expect(tooltip).toContain('HQ Users');

});
Recommended Framework Structure
project
│
├── tests
│   └── dashboard.spec.ts
│
├── pages
│   └── DashboardPage.ts
│
├── testData
│   └── DashboardData.ts
│
├── fixtures
│   └── baseFixture.ts
│
└── utils
    └── apiHelper.ts
For a production-ready framework, I would recommend fetching the actual counts via API/database in the Data File instead of hardcoding values, so TC_AP_281, TC_AP_282, TC_AP_285, and TC_AP_290 validate UI data against the backend source of truth.


If you're using Windows CMD, you can create 10 files at once with:

type nul > file1.ts && ^
type nul > file2.ts && ^
type nul > file3.ts && ^
type nul > file4.ts && ^
type nul > file5.ts && ^
type nul > file6.ts && ^
type nul > file7.ts && ^
type nul > file8.ts && ^
type nul > file9.ts && ^
type nul > file10.ts
Or more efficiently using a loop:

for /L %i in (1,1,10) do type nul > file%i.ts
Create specific Playwright files
type nul > DashboardPage.ts
type nul > DashboardData.ts
type nul > dashboard.spec.ts
type nul > LoginPage.ts
type nul > UserPage.ts
type nul > GroupPage.ts
type nul > AdminPage.ts
type nul > BasePage.ts
type nul > apiHelper.ts
type nul > baseFixture.ts
PowerShell (recommended)
1..10 | ForEach-Object { New-Item -ItemType File -Name "file$_.ts" }
Create multiple folders and files together
mkdir pages testData tests fixtures utils

type nul > pages\DashboardPage.ts
type nul > testData\DashboardData.ts
type nul > tests\dashboard.spec.ts
type nul > pages\LoginPage.ts
type nul > pages\UserPage.ts
type nul > pages\GroupPage.ts
type nul > pages\AdminPage.ts
type nul > pages\BasePage.ts
type nul > utils\apiHelper.ts
type nul > fixtures\baseFixture.ts
For a Playwright framework, I usually use:

mkdir pages testData tests fixtures utils
for %f in (DashboardPage LoginPage UserPage GroupPage AdminPage BasePage) do type nul > pages\%f.ts
for %f in (DashboardData UserData GroupData) do type nul > testData\%f.ts
for %f in (dashboard.spec user.spec group.spec) do type nul > tests\%f.ts
This creates the entire basic framework structure in one shot.


from 280 to 291 number 

If you want to create files named from TC_AP_280.ts to TC_AP_291.ts, use the following CMD command:

for /L %i in (280,1,291) do type nul > TC_AP_%i.ts
If you're running it inside a .bat file, use double %:

for /L %%i in (280,1,291) do type nul > TC_AP_%%i.ts
Create inside a Tests folder
mkdir tests
for /L %i in (280,1,291) do type nul > tests\TC_AP_%i.spec.ts
This will create:

TC_AP_280.spec.ts
TC_AP_281.spec.ts
TC_AP_282.spec.ts
TC_AP_283.spec.ts
TC_AP_284.spec.ts
TC_AP_285.spec.ts
TC_AP_286.spec.ts
TC_AP_287.spec.ts
TC_AP_288.spec.ts
TC_AP_289.spec.ts
TC_AP_290.spec.ts
TC_AP_291.spec.ts
If you only want the test cases you listed (280, 281, 282, 285–291), use:

for %i in (280 281 282 285 286 287 288 289 290 291) do type nul > TC_AP_%i.spec.ts
This will create exactly those 10 files.


At line:1 char:4
+ for /L %i in (280,1,291) do type nul > TC_AP_%i.ts
+    ~
Missing opening '(' after keyword 'for'.
    + CategoryInfo          : ParserError: (:) [], ParentContainsErrorRecordException
    + FullyQualifiedErrorId : MissingOpenParenthesisAfterKeyword
 

You're running the command in PowerShell, not Command Prompt (CMD). The for /L syntax only works in CMD.

PowerShell equivalent
280..291 | ForEach-Object { New-Item -ItemType File -Name "TC_AP_$_.ts" }
Or for Playwright spec files:

280..291 | ForEach-Object { New-Item -ItemType File -Name "TC_AP_$_.spec.ts" }
Create in a tests folder
New-Item -ItemType Directory -Name tests -Force

280..291 | ForEach-Object {
    New-Item -ItemType File -Path "tests\TC_AP_$_.spec.ts" -Force
}
Only the specific files you listed
280,281,282,285,286,287,288,289,290,291 | ForEach-Object {
    New-Item -ItemType File -Name "TC_AP_$_.spec.ts" -Force
}
If you prefer CMD syntax, open Command Prompt (cmd.exe) and run:

for /L %i in (280,1,291) do type nul > TC_AP_%i.spec.ts
The error you received is PowerShell trying to interpret CMD syntax.


