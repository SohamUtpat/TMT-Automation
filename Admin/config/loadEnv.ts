import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { ENVIRONMENTS, resolveTarget } from './environments';

/**
 * Load env files then apply TARGET preset for any unset URL vars.
 * Order: `.env` → `.env.local` (local wins) → TARGET defaults for missing BASE_URL / API_BASE_URL.
 */
export function loadEnv(rootDir: string = process.cwd()): void {
  const envPath = path.join(rootDir, '.env');
  const localPath = path.join(rootDir, '.env.local');

  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
  if (fs.existsSync(localPath)) {
    dotenv.config({ path: localPath, override: true });
  }

  const preset = ENVIRONMENTS[resolveTarget()];
  if (!process.env.BASE_URL) {
    process.env.BASE_URL = preset.BASE_URL;
  }
  if (!process.env.API_BASE_URL) {
    process.env.API_BASE_URL = preset.API_BASE_URL;
  }
}
