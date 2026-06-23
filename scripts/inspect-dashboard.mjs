import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto('http://18.142.102.68', { waitUntil: 'networkidle', timeout: 60000 });
await page.locator('#username').fill('soham05');
await page.locator('#password').fill('Josh@123');
await page.locator('button.ant-btn-primary').click();

try {
  await page.getByText('Dashboard', { exact: true }).first().waitFor({ timeout: 25000 });
  console.log('LOGGED IN OK');
} catch {
  console.log('LOGIN FAILED BODY:', (await page.locator('body').innerText()).slice(0, 800));
  await browser.close();
  process.exit(1);
}

await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(2000);

const cards = await page.locator('.ant-card, div').filter({ hasText: /Mobile App Users|HQ Members|Total Groups/ }).all();
console.log('Matching card-like count:', cards.length);
for (let i = 0; i < Math.min(cards.length, 8); i++) {
  const txt = (await cards[i].innerText()).replace(/\n/g, ' | ').slice(0, 100);
  const cls = (await cards[i].getAttribute('class'))?.slice(0, 80);
  console.log(`EL ${i}: class=${cls} text=${txt}`);
}

console.log('Has recharts:', await page.locator('.recharts-wrapper').count());
console.log('Users Count visible:', await page.getByText('Users Count').isVisible().catch(() => false));
console.log('Group Name visible:', await page.getByText('Group Name').isVisible().catch(() => false));

const bars = await page.locator('.recharts-bar-rectangle').count();
console.log('Bar count:', bars);

const venn = page.locator('canvas, svg').first();
console.log('Canvas/svg count:', await page.locator('canvas, svg').count());

await page.screenshot({ path: 'dashboard-full.png', fullPage: true });
await browser.close();
