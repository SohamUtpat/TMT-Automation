import fs from 'fs';
import os from 'os';
import path from 'path';
import { TestDataGenerator } from './TestDataGenerator';

export type BulkUploadCsvRow = {
  userName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phone?: string;
  language?: string;
  roles?: string;
  groups?: string;
  dorakuUserCode?: string;
};

/** Builds mobile-user bulk-upload CSV files for automation. */
export class BulkUploadCsvBuilder {
  /** Headers from the downloadable template (includes Password). */
  static readonly templateHeaders = [
    'User Name',
    'First Name',
    'Last Name',
    'Email',
    'Password',
    'Phone',
    'Language Preference',
    'Roles',
    'Groups',
    'DorakuUserCode',
  ] as const;

  /** Required headers per TC_AP_273 specification. */
  static readonly specHeaders = [
    'User Name',
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Language Preference',
    'Roles',
    'Groups',
    'DorakuUserCode',
  ] as const;

  static buildRow(overrides: BulkUploadCsvRow = {}): string[] {
    const userName = overrides.userName ?? TestDataGenerator.generateUniqueUsername();

    return [
      userName,
      overrides.firstName ?? TestDataGenerator.generateRandomName(),
      overrides.lastName ?? TestDataGenerator.generateRandomLastName(),
      overrides.email ?? TestDataGenerator.generateUniqueEmail(),
      overrides.password ?? TestDataGenerator.generateValidPassword(),
      overrides.phone ?? '',
      overrides.language ?? 'eng',
      overrides.roles ?? 'MOBILE',
      overrides.groups ?? 'HQ',
      overrides.dorakuUserCode ?? '',
    ];
  }

  static buildCsvContent(
    rowCount: number,
    options: { headers?: readonly string[]; rowBuilder?: (index: number) => BulkUploadCsvRow } = {},
  ): string {
    const headers = options.headers ?? BulkUploadCsvBuilder.templateHeaders;
    const lines = [headers.join(',')];

    for (let index = 0; index < rowCount; index += 1) {
      const overrides = options.rowBuilder?.(index) ?? {};
      if (!overrides.userName) {
        overrides.userName = `bulk_${index}_${Date.now()}`;
      }
      lines.push(BulkUploadCsvBuilder.buildRow(overrides).join(','));
    }

    return `${lines.join('\n')}\n`;
  }

  static writeTempCsv(
    rowCount: number,
    options: {
      filename?: string;
      headers?: readonly string[];
      rowBuilder?: (index: number) => BulkUploadCsvRow;
    } = {},
  ): string {
    const filename = options.filename ?? `bulk-upload-${rowCount}-${Date.now()}.csv`;
    const filePath = path.join(os.tmpdir(), filename);
    fs.writeFileSync(filePath, BulkUploadCsvBuilder.buildCsvContent(rowCount, options), 'utf8');
    return filePath;
  }
}
