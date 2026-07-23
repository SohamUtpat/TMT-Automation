/**
 * Named target environments for Playwright runs.
 * Select with TARGET=local|dev (default: dev).
 * Values are overridden by process.env / .env.local when already set.
 */
export type TargetEnv = 'local' | 'dev';

export const ENVIRONMENTS: Record<
  TargetEnv,
  { BASE_URL: string; API_BASE_URL: string }
> = {
  local: {
    BASE_URL: 'http://localhost:8000',
    API_BASE_URL: 'http://localhost:9091',
  },
  dev: {
    BASE_URL: 'https://admin.ntmt.dev.gulftmt.com',
    API_BASE_URL: 'https://api.ntmt.dev.gulftmt.com',
  },
};

export function resolveTarget(): TargetEnv {
  const raw = (process.env.TARGET ?? 'dev').toLowerCase();
  return raw === 'local' ? 'local' : 'dev';
}
