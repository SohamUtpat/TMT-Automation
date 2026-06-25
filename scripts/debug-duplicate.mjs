import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  storageState: 'playwright/.auth/admin.json',
  baseURL: 'http://18.142.102.68',
});
const page = await ctx.newPage();
await page.goto('/groups', { waitUntil: 'commit' });
await page.getByRole('button', { name: 'Create Group' }).waitFor({ timeout: 90000 });
await page.getByRole('button', { name: 'Create Group' }).click();
await page.locator('.ant-modal').filter({ hasText: 'Create New Group' }).waitFor();
await page.getByPlaceholder('Type here').first().fill('HQ Group');
await page.getByPlaceholder('Type here').nth(1).fill('HQ');
const resp = page.waitForResponse((r) => r.url().includes('/group') && r.request().method() === 'POST');
await page.getByRole('button', { name: 'Create', exact: true }).click();
const response = await resp;
console.log('status', response.status());
console.log('body', await response.text().catch(() => ''));
await page.waitForTimeout(3000);
const msgs = await page.locator('.ant-message-notice-content').allTextContents();
console.log('toasts', msgs);
console.log('modal open', await page.locator('.ant-modal').filter({ hasText: 'Create New Group' }).isVisible());
await browser.close();
