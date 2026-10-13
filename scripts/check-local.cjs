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
  const ums = 'http://localhost:8082';

  const results = await Promise.all([
    check(frontend),
    check(gateway),
    check(ums),
  ]);

  const labels = ['frontend', 'api-gateway', 'user-management'];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.ok) {
      console.log(`OK  ${labels[i]} ${r.url} (HTTP ${r.status})`);
    } else {
      console.log(
        `DOWN ${labels[i]} ${r.url} — ${r.error || (r.status != null ? `HTTP ${r.status}` : 'unreachable')}`,
      );
    }
  }

  const allOk = results.every((r) => r.ok);
  if (!allOk) {
    console.log('');
    console.log('Start local stack before npm run test:local:');
    console.log('  1. Docker: Kafka (:9092) + Postgres (from gulfnet-tmt-backend docker-compose)');
    console.log('  2. Backend: user-management (:8082) + api-gateway (:9091)');
    console.log('  3. Frontend: gulfnet-tmt-frontend npm run dev (:8000)');
    console.log('     Set BACKEND_BASE_URL=http://localhost:9091/api/user-management-service/');
    console.log('  Or run against remote: npm run test:login with TARGET=dev (CLI overrides .env.local)');
    process.exitCode = 1;
  }
})();
