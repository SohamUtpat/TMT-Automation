import fs from 'node:fs';

type StorageState = {
  origins?: Array<{
    localStorage?: Array<{ name: string; value: string }>;
  }>;
};

/** Reuse saved auth when the JWT in storageState is still valid. */
export function isAuthStateValid(authFile: string, bufferMs = 60_000): boolean {
  if (!fs.existsSync(authFile)) {
    return false;
  }

  try {
    const state = JSON.parse(fs.readFileSync(authFile, 'utf-8')) as StorageState;
    const token = state.origins?.[0]?.localStorage?.find((entry) => entry.name === 'gulf_net_admin-token')
      ?.value;

    if (!token) {
      return false;
    }

    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()) as {
      exp?: number;
    };

    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now() + bufferMs;
  } catch {
    return false;
  }
}
