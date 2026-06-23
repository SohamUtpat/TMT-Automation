import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto('http://18.142.102.68');
await page.locator('#username').fill('soham05');
await page.locator('#password').fill('Josh@123');
await page.locator('button.ant-btn-primary').click();
await page.getByText('Dashboard', { exact: true }).first().waitFor({ timeout: 25000 });

// Top boxes structure
const topCard = page.locator('.ant-card.dashboard-background').first();
console.log('TOP CARD HTML snippet:', (await topCard.innerHTML()).slice(0, 1500));

// Individual stat boxes - look for structure
const stats = page.locator('.dashboard-css .ant-flex, .backgroundcard .ant-flex').first();
console.log('Stats area text:', await stats.innerText());

// Venn section
const vennSection = page.locator('.dashboard-container').filter({ hasText: 'Regular Users' });
console.log('Venn section count:', await vennSection.count());
if (await vennSection.count()) {
  console.log('Venn text:', (await vennSection.first().innerText()).slice(0, 500));
}

// Mobile App Users click
const mobileLink = page.getByText('Mobile App Users >').or(page.locator('text=Mobile App Users').filter({ hasText: '>' }));
console.log('Mobile App Users > count:', await page.getByText(/Mobile App Users\s*>/).count());

// Graph axis labels
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1500);
console.log('Users Count:', await page.getByText('Users Count').count());
console.log('Group Name:', await page.getByText('Group Name').count());

// Hover first bar for tooltip
const bar = page.locator('.recharts-bar-rectangle').first();
await bar.hover({ force: true });
await page.waitForTimeout(1000);
const tooltip = page.locator('.recharts-tooltip-wrapper, .recharts-default-tooltip');
console.log('Tooltip visible:', await tooltip.isVisible());
if (await tooltip.isVisible()) console.log('Tooltip text:', await tooltip.innerText());

// x axis labels
const xLabels = page.locator('.recharts-xAxis .recharts-cartesian-axis-tick-value');
console.log('X labels count:', await xLabels.count());
for (let i = 0; i < Math.min(5, await xLabels.count()); i++) {
  console.log('X label', i, await xLabels.nth(i).textContent());
}

await browser.close();
