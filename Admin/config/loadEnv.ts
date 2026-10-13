import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { ENVIRONMENTS, resolveTarget } from './environments';

/** Keys that CLI / CI (`cross-env TARGET=dev`, etc.) must keep over `.env.local`. */
const CLI_OVERRIDE_KEYS = [
  'TARGET',
  'BASE_URL',
  'API_BASE_URL',
  'VALID_USERNAME',
  'VALID_PASSWORD',
  'MOBILE_USERNAME',
  'MOBILE_PASSWORD',
  'START_FRONTEND',
  'FRONTEND_DIR',
  'PW_WORKERS',
] as const;

/**
 * Load env files then apply TARGET preset for any unset URL vars.
 * Order: capture CLI env → `.env` → `.env.local` (local wins files) → restore CLI → TARGET presets.
 */
export function loadEnv(rootDir: string = process.cwd()): void {
  const envPath = path.join(rootDir, '.env');
  const localPath = path.join(rootDir, '.env.local');

  const cliOverrides: Partial<Record<(typeof CLI_OVERRIDE_KEYS)[number], string>> = {};
  for (const key of CLI_OVERRIDE_KEYS) {
    const value = process.env[key];
    if (value !== undefined) {
      cliOverrides[key] = value;
    }
  }

  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
  if (fs.existsSync(localPath)) {
    dotenv.config({ path: localPath, override: true });
  }

  for (const key of CLI_OVERRIDE_KEYS) {
    const value = cliOverrides[key];
    if (value !== undefined) {
      process.env[key] = value;
    }
  }

  const preset = ENVIRONMENTS[resolveTarget()];
  // If TARGET came from CLI but URLs did not, drop file-based URLs so the preset applies.
  if (cliOverrides.TARGET !== undefined) {
    if (cliOverrides.BASE_URL === undefined) {
      delete process.env.BASE_URL;
    }
    if (cliOverrides.API_BASE_URL === undefined) {
      delete process.env.API_BASE_URL;
    }
  }

  if (!process.env.BASE_URL) {
    process.env.BASE_URL = preset.BASE_URL;
  }
  if (!process.env.API_BASE_URL) {
    process.env.API_BASE_URL = preset.API_BASE_URL;
  }
}
