import { chromium } from 'playwright';
import path from 'path';

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

for (const file of ['large.jpg', 'tiny.png', 'invalid.pdf']) {
  await page.getByRole('button', { name: 'Create Group' }).click().catch(() => {});
  await page.locator('.ant-modal').filter({ hasText: 'Create New Group' }).waitFor().catch(() => {});
  const fp = path.resolve(`Admin/test-assets/${file}`);
  await page.locator('.group-modal-body-image-camera input[type="file"]').setInputFiles(fp);
  await page.waitForTimeout(2500);
  const msgs = await page.locator('.ant-message-notice-content').allTextContents();
  console.log(file, '->', msgs);
}

await browser.close();
