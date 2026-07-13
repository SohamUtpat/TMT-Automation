import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto(process.env.BASE_URL ?? 'https://admin.ntmt.dev.gulftmt.com', { waitUntil: 'networkidle', timeout: 60000 });
await page.locator('#username').fill('soham05');
await page.locator('#password').fill('Josh@123');
await page.locator('button.ant-btn-primary').click();

for (let i = 0; i < 15; i++) {
  await page.waitForTimeout(2000);
  const url = page.url();
  const body = await page.locator('body').innerText();
  console.log(`--- after ${(i + 1) * 2}s URL=${url}`);
  console.log(body.slice(0, 500));
  if (!body.includes('LOG IN') || body.includes('Dashboard') || body.includes('Mobile App Users')) break;
}

const msg = page.locator('.ant-message-notice-content');
if (await msg.count()) console.log('TOAST:', await msg.first().textContent());

await page.screenshot({ path: 'login-debug.png', fullPage: true });
await browser.close();
