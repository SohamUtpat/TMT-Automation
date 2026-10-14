import { webcrypto } from 'node:crypto';
import type { APIRequestContext } from '@playwright/test';

type CryptoOn = {
  mode: 'on';
  keyId: string;
  cryptoKey: CryptoKey;
};

type CryptoOff = {
  mode: 'off';
};

type PasswordCryptoMaterial = CryptoOn | CryptoOff;

let cachedMaterial: PasswordCryptoMaterial | null = null;

const INVALID_ENCRYPTED_PASSWORD = /invalid encrypted password/i;

export class PasswordCryptoError extends Error {
  constructor(message = 'Password crypto failed') {
    super(message);
    this.name = 'PasswordCryptoError';
  }
}

export const clearPasswordCryptoCache = (): void => {
  cachedMaterial = null;
};

const pemToArrayBuffer = (pem: string): ArrayBuffer => {
  const b64 = pem
    .replaceAll('-----BEGIN PUBLIC KEY-----', '')
    .replaceAll('-----END PUBLIC KEY-----', '')
    .replace(/\s/g, '');
  return Buffer.from(b64, 'base64').buffer;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => Buffer.from(buffer).toString('base64');

const importPublicKey = async (pem: string): Promise<CryptoKey> =>
  webcrypto.subtle.importKey(
    'spki',
    pemToArrayBuffer(pem),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt'],
  );

const encryptPassword = async (plainText: string, keyId: string, publicKey: CryptoKey): Promise<string> => {
  const encoded = new TextEncoder().encode(plainText);
  const cipherBuffer = await webcrypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, encoded);
  return `enc:${keyId}:${arrayBufferToBase64(cipherBuffer)}`;
};

export const isInvalidEncryptedPassword = (response: unknown): boolean => {
  if (typeof response !== 'object' || response === null) {
    return false;
  }

  const error = (response as Record<string, unknown>).error;
  if (typeof error === 'object' && error !== null) {
    const message = (error as Record<string, unknown>).message;
    if (typeof message === 'string' && INVALID_ENCRYPTED_PASSWORD.test(message)) {
      return true;
    }
  }

  const message = (response as Record<string, unknown>).message;
  return typeof message === 'string' && INVALID_ENCRYPTED_PASSWORD.test(message);
};

export async function getPasswordCryptoMaterial(
  request: APIRequestContext,
  cryptoUrl: string,
  forceRefresh = false,
): Promise<PasswordCryptoMaterial> {
  if (!forceRefresh && cachedMaterial) {
    return cachedMaterial;
  }

  const response = await request.get(cryptoUrl);

  if (response.status() === 503) {
    cachedMaterial = { mode: 'off' };
    return cachedMaterial;
  }

  if (!response.ok()) {
    throw new PasswordCryptoError(
      `Unable to resolve password crypto keys (HTTP ${response.status()} from ${cryptoUrl})`,
    );
  }

  const body = await response.json().catch(() => ({}));
  const data =
    typeof body === 'object' && body !== null
      ? ((body as Record<string, unknown>).data as Record<string, unknown> | undefined)
      : undefined;
  const keyId = data?.keyId;
  const publicKeyPem = data?.publicKey;

  if (typeof keyId !== 'string' || !keyId || typeof publicKeyPem !== 'string' || !publicKeyPem) {
    throw new PasswordCryptoError('Invalid public key response');
  }

  cachedMaterial = {
    mode: 'on',
    keyId,
    cryptoKey: await importPublicKey(publicKeyPem),
  };

  return cachedMaterial;
}

export async function preparePasswordFields(
  request: APIRequestContext,
  cryptoUrl: string,
  fields: Record<string, string | undefined>,
  options?: { forceRefresh?: boolean },
): Promise<Record<string, string>> {
  const material = await getPasswordCryptoMaterial(request, cryptoUrl, options?.forceRefresh);
  const prepared: Record<string, string> = {};

  for (const [key, value] of Object.entries(fields)) {
    if (value == null || value === '') {
      prepared[key] = value ?? '';
      continue;
    }

    if (material.mode === 'off') {
      prepared[key] = value;
    } else {
      prepared[key] = await encryptPassword(value, material.keyId, material.cryptoKey);
    }
  }

  return prepared;
}
