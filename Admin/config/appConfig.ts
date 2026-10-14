import { ENVIRONMENTS, resolveTarget } from './environments';

/** Default app URL — override with BASE_URL env var, or set TARGET=local|dev. */
export const DEFAULT_BASE_URL = ENVIRONMENTS.dev.BASE_URL;

/** Default API host — override with API_BASE_URL env var, or set TARGET=local|dev. */
export const DEFAULT_API_BASE_URL = ENVIRONMENTS.dev.API_BASE_URL;

export function getBaseUrl(): string {
  const preset = ENVIRONMENTS[resolveTarget()];
  return (process.env.BASE_URL ?? preset.BASE_URL).replace(/\/$/, '');
}

/**
 * User-management API root (e.g. https://api…/api/user-management-service).
 *
 * On TARGET=local the SPA calls relative `/api/user-management-service/*` and
 * webpack-dev-server proxies that path (to remote DEV or a local gateway).
 * Playwright `page.request` must use the same origin — calling :9091 directly
 * fails with ECONNREFUSED when the gateway is not running even though the UI works.
 */
export function getApiBaseUrl(): string {
  if (isLocalTarget()) {
    return `${getBaseUrl()}/api/user-management-service`;
  }

  const preset = ENVIRONMENTS[resolveTarget()];
  const apiHost = (process.env.API_BASE_URL ?? preset.API_BASE_URL).replace(/\/$/, '');
  return `${apiHost}/api/user-management-service`;
}

/** True when running against the local frontend/gateway stack. */
export function isLocalTarget(): boolean {
  return resolveTarget() === 'local';
}
