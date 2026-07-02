import { chromium } from 'playwright';

const base = (process.env.BASE_URL ?? 'http://18.142.102.68').replace(/\/$/, '');
const suffix = `${Date.now()}`;
const password = `Tt@${String(suffix).slice(-5)}`.slice(0, 15);
const userName = `user_${suffix}`;
const email = `user_${suffix}@autotest.local`;

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ storageState: 'playwright/.auth/admin.json', baseURL: base });
const page = await ctx.newPage();
await page.goto('/dashboard', { waitUntil: 'commit', timeout: 120_000 });

const create = await page.evaluate(
  async ({ userName, email }) => {
    const token = localStorage.getItem('gulf_net_admin-token');
    const fd = new FormData();
    fd.append('userName', userName);
    fd.append('firstName', 'John');
    fd.append('lastName', 'Doe');
    fd.append('email', email);
    fd.append('phone', '');
    fd.append('languagePreference', 'eng');
    fd.append('dorakuEnable', 'false');
    fd.append('userRole', 'ADMIN');
    fd.append('appType', 'ADMIN');
    fd.append('status', '1');
    const resp = await fetch('/api/user-management-service/user', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token ?? ''}`, language: 'english' },
      body: fd,
    });
    return { status: resp.status, body: await resp.json() };
  },
  { userName, email },
);

const userId = create.body?.data?.user?.id;
console.log('CREATE userId:', userId);

const attempts = [
  { method: 'PUT', url: `/api/user-management-service/user/${userId}`, multipart: { password, userName, firstName: 'John', lastName: 'Doe', email, phone: '', languagePreference: 'eng', status: '1' } },
  { method: 'POST', url: '/api/user-management-service/user/reset-password', json: { userId, password } },
  { method: 'POST', url: `/api/user-management-service/user/${userId}/reset-password`, json: { password } },
  { method: 'PUT', url: `/api/user-management-service/user/${userId}/password`, json: { password } },
];

for (const attempt of attempts) {
  const result = await page.evaluate(
    async ({ method, url, multipart, json }) => {
      const token = localStorage.getItem('gulf_net_admin-token');
      const headers = { Authorization: `Bearer ${token ?? ''}`, language: 'english' };
      let body;
      if (multipart) {
        const fd = new FormData();
        for (const [k, v] of Object.entries(multipart)) fd.append(k, v);
        body = fd;
      } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(json);
      }
      const resp = await fetch(url, { method, headers, body });
      return { status: resp.status, body: (await resp.text()).slice(0, 200) };
    },
    attempt,
  );
  console.log('\n', attempt.method, attempt.url, result);
}

await browser.close();
