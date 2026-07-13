/** Default app URL — override with BASE_URL env var in CI/local runs. */
export const DEFAULT_BASE_URL = 'https://admin.ntmt.dev.gulftmt.com';

/** Default API host — override with API_BASE_URL env var. */
export const DEFAULT_API_BASE_URL = 'https://api.ntmt.dev.gulftmt.com';

export function getBaseUrl(): string {
  return (process.env.BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, '');
}

/** User-management API root (e.g. https://api…/api/user-management-service). */
export function getApiBaseUrl(): string {
  const apiHost = (process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, '');
  return `${apiHost}/api/user-management-service`;
}
