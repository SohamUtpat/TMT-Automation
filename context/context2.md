



That's a good use case for Playwright + TypeScript. The usual approach is:

Create a Playwright project.

Implement a Page Object Model (POM) for the Login page.

Convert each of your 17 test cases into individual Playwright tests.

Use data-driven testing where possible to avoid repetitive code.

1. Install Playwright
npm init -y
npm install -D @playwright/test
npx playwright install
Initialize Playwright:

npx playwright test --init
2. Create a Login Page Object
pages/LoginPage.ts

import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly username: Locator;
  readonly password: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.username = page.locator('#username');
    this.password = page.locator('#password');
    this.loginButton = page.locator('#loginBtn');
    this.errorMessage = page.locator('.error-message');
  }

  async navigate() {
    await this.page.goto('https://your-app-url.com/login');
  }

  async login(user: string, pass: string) {
    await this.username.fill(user);
    await this.password.fill(pass);
    await this.loginButton.click();
  }
}
3. Example Login Tests
tests/login.spec.ts

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test('Valid Login', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.navigate();
  await loginPage.login('admin', 'Admin123');

  await expect(page).toHaveURL(/dashboard/);
});

test('Invalid Password', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.navigate();
  await loginPage.login('admin', 'wrongpass');

  await expect(loginPage.errorMessage)
    .toHaveText('Invalid username or password');
});
4. Data-Driven Approach for Multiple Cases
Instead of writing 17 separate blocks manually:

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

const testData = [
  {
    name: 'Valid Login',
    username: 'admin',
    password: 'Admin123',
    expected: 'success'
  },
  {
    name: 'Invalid Password',
    username: 'admin',
    password: 'wrong',
    expected: 'error'
  },
  {
    name: 'Blank Username',
    username: '',
    password: 'Admin123',
    expected: 'error'
  }
];

for (const data of testData) {
  test(data.name, async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.navigate();
    await loginPage.login(data.username, data.password);

    if (data.expected === 'success') {
      await expect(page).toHaveURL(/dashboard/);
    } else {
      await expect(loginPage.errorMessage).toBeVisible();
    }
  });
}
5. Typical Login Test Cases You Can Automate
If your 17 test cases are similar, they may include:

Test Case	Expected Result
Valid username & password	Login success
Invalid username	Error message
Invalid password	Error message
Both invalid	Error message
Empty username	Validation message
Empty password	Validation message
Empty username & password	Validation message
Username with spaces	Validation message
Password with spaces	Validation message
SQL Injection attempt	Login blocked
XSS attempt	Login blocked
Remember Me checked	Session persists
Password hidden	Masked input
Enter key login	Login triggered
Locked account	Proper message
Inactive account	Proper message
Logout then login again	Success
If you paste your 17 login test cases (or a screenshot/table), I can generate the complete Playwright TypeScript automation framework and code for all 17 cases.


cee03fb5-6eef-4ea4-8c98-30de697eca9b.png
I want to select these colums on and want copy how to do that in google sheet 

9b743cd2-6314-46aa-a3f9-c42b466a2300.png
here is the actual login page 

7eb88a38-da6e-47b5-9ce3-b8b5dc86b3d9.png
Why is getting red line what is the error 

ecb0d06a-23b0-4108-a93f-fba8a77df3d8.png
here is my folder structure 

ee1cf7e6-0642-4942-a4aa-dfefe5df8d9f.png
Now what is this red line is comming 

468a1c9f-a3e8-44d8-9d48-a8f4638e118d.png
Can you explain me this error 

d4b06760-dcb7-4256-9f4c-5c46a3765170.png
Can you help me to solve this error

4bcf78ac-3a9b-4a91-83b8-f44ebd4cc0dd.png
see this 

212872b2-5be7-446c-827d-5fa3653503a2.png
fe8fd404-6cf8-4d33-9cc6-f625b4cf24b8.png
Just two test cases are failing 11 and 17 and the above errors are displayed 

If only TC_AP_04, TC_AP_05, and TC_AP_08 are timing out after 30 seconds, it means one of the assertions in those tests is waiting for something that never appears.

Let's look at each:

TC_AP_04 - Valid Long Username
Your test case says:

Verify user can Login - with Valid Long UserName

But are you actually using a valid long username that exists in the system?

If your code is something like:

await login.login(
  loginData.longUserName,
  loginData.validPassword
);

await expect(page.getByText('Dashboard')).toBeVisible();
and longUserName is not a real valid user, login will fail and Playwright will wait forever for Dashboard.

Check:

console.log(loginData.longUserName);
If it's not an actual account, either:

Use a real valid long username, or

Change the expected result to an error message.

TC_AP_05 - Invalid Username
This should show:

Invalid username or password
Instead of:

await expect(login.errorMessage).toBeVisible();
try:

await expect(
  page.getByText('Invalid username or password')
).toBeVisible({ timeout: 10000 });
If it still times out, inspect the actual toast text and locator.

TC_AP_08 - Invalid Username and Password
Same issue as TC_AP_05.

Use:

await expect(
  page.getByText('Invalid username or password')
).toBeVisible({ timeout: 10000 });
Debug these tests quickly
Add this before the failing assertion:

await page.screenshot({
  path: 'debug.png',
  fullPage: true
});

console.log(await page.content());
or run:

npx playwright test Admin/Login/TC-05.spec.ts --headed
Watch what happens:

Does the toast appear?

Does the page stay on login?

Is the text exactly Invalid username or password?

Most likely root cause
For TC_AP_05 and TC_AP_08, your locator is probably wrong.

For TC_AP_04, you're probably expecting a successful login with a username that is not actually valid in the application.

Paste the code of TC-04.spec.ts, TC-05.spec.ts, and TC-08.spec.ts, and I can pinpoint the exact line causing the timeout.


test('TC_AP_04 - Valid Long Username', async ({ page }) => {
  const login = new LoginPage(page);

  await login.navigate();
  await login.login('soham05', 'Josh@123');

    await expect(
    page.getByRole('button', { name: 'Logout' })
  ).toBeVisible({ timeout: 10000 });

  await expect(
    page.getByText('soham05')
  ).toBeVisible();
});

test('TC_AP_05 - Invalid Username Not Present', async ({ page }) => {
  const login = new LoginPage(page);

  await login.navigate();
  await login.login('UserNotPresent123', 'Josh@123');

  await expect(login.errorMessage).toContainText(
  'Invalid username or password'
);
});

test('TC_AP_08 - Invalid Username and Password', async ({ page }) => {
  const login = new LoginPage(page);

  await login.navigate();
  await login.login('wronguser', 'wrongpassword');

 await expect(login.errorMessage).toContainText(
  'Invalid username or password'
);
});

Looking at your code, I see two likely issues.

TC_AP_04
Your test name says:

TC_AP_04 - Valid Long Username
But you're actually logging in with:

await login.login('soham05', 'Josh@123');
That's the normal username, not a long username. However, the code itself should pass if login succeeds.

Problem
This locator may not exist:

page.getByRole('button', { name: 'Logout' })
From your earlier screenshots, Logout is in the sidebar and may not be exposed as a button role.

Replace with
await expect(page.getByText('Dashboard')).toBeVisible({
  timeout: 15000
});

await expect(page.getByText('soham05')).toBeVisible();
or

await expect(page.getByText('Mobile App Users')).toBeVisible();
Those definitely appear after login.

TC_AP_05 and TC_AP_08
The issue is almost certainly your errorMessage locator.

Show me what's inside your LoginPage.ts for:

errorMessage
because I suspect you have something like:

this.errorMessage = page.locator('.ant-message');
or another locator that doesn't match the actual toast.

Quick fix
Instead of:

await expect(login.errorMessage).toContainText(
  'Invalid username or password'
);
try:

await expect(
  page.getByText('Invalid username or password')
).toBeVisible({ timeout: 10000 });
If that still times out, the toast disappears too quickly.

Then use:

await expect(
  page.locator('.ant-message-notice-content')
).toContainText('Invalid username or password');
Best debugging step
Run only one failing test:

npx playwright test Admin/Login/TC-05.spec.ts --headed
and tell me what errorMessage is defined as in LoginPage.ts.

That will let me give you the exact locator fix.


8bddc627-0aca-4f8c-9b23-7c720c64e704.png
Can you tell me how to copy test cases from 280 to 291

To copy only the test cases from TC_AP_280 to TC_AP_291 in Google Sheets:

Method 1: Using Row Numbers
Click on row number 280 on the left side.

Scroll down to row 291.

Hold Shift and click row number 291.

Rows 280–291 will be selected.

Press:

Ctrl + C
to copy.

Paste anywhere using:

Ctrl + V
Method 2: Select Only Columns A-C for Rows 280-291
Click cell A280.

Hold Shift and click cell C291.

This selects the entire range:

A280:C291
Press:

Ctrl + C
Paste into Excel, Notepad, VS Code, or another Google Sheet.

If you want to paste them into ChatGPT
After copying:

A280:C291
paste them here, and I can generate Playwright test scripts for TC_AP_280 through TC_AP_291.


