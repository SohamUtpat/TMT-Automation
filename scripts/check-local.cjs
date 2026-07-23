/**
 * Prints whether local frontend/gateway look reachable before a local test run.
 * Does not start Java services — run those from gulfnet-tmt-backend first.
 */
const http = require('http');

function check(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve({ url, ok: res.statusCode > 0 && res.statusCode < 500, status: res.statusCode });
      res.resume();
    });
    req.on('error', (err) => resolve({ url, ok: false, error: err.message }));
    req.setTimeout(3000, () => {
      req.destroy();
      resolve({ url, ok: false, error: 'timeout' });
    });
  });
}

(async () => {
  const frontend = process.env.BASE_URL || 'http://localhost:8000';
  const gateway = process.env.API_BASE_URL || 'http://localhost:9091';

  const results = await Promise.all([check(frontend), check(gateway)]);

  for (const r of results) {
    if (r.ok) {
      console.log(`OK  ${r.url} (HTTP ${r.status})`);
    } else {
      console.log(`DOWN ${r.url} — ${r.error || (r.status != null ? `HTTP ${r.status}` : 'unreachable')}`);
    }
  }

  const allOk = results.every((r) => r.ok);
  if (!allOk) {
    console.log('');
    console.log('Start local stack before npm run test:local:');
    console.log('  1. Backend: user-management (:8082) + api-gateway (:9091)');
    console.log('  2. Frontend: gulfnet-tmt-frontend npm run dev (:8000)');
    console.log('     Set BACKEND_BASE_URL=http://localhost:9091/api/user-management-service/');
    process.exitCode = 1;
  }
})();
