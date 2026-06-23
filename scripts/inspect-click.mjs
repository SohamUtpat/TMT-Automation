import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto('http://18.142.102.68');
await page.locator('#username').fill('soham05');
await page.locator('#password').fill('Josh@123');
await page.locator('button.ant-btn-primary').click();
await page.getByText('Dashboard', { exact: true }).first().waitFor({ timeout: 25000 });

const urlBefore = page.url();
await page.getByText(/Mobile App Users\s*>/).click();
await page.waitForTimeout(2000);
console.log('URL before:', urlBefore);
console.log('URL after click:', page.url());
console.log('Page heading:', await page.locator('h1, .page-title, [class*="title"]').first().textContent().catch(() => 'n/a'));
console.log('Body snippet:', (await page.locator('body').innerText()).slice(0, 300));

// Check all dashboard-items for Total Groups and Admins
const items = page.locator('.dashboard-item');
const count = await items.count();
for (let i = 0; i < count; i++) {
  console.log('ITEM', i, await items.nth(i).innerText());
}

await browser.close();
