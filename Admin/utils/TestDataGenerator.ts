/** Generates unique test data for every test run — no hardcoded user identities. */

export class TestDataGenerator {
  private static suffix(): string {
    return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }

  /** Letters only — matches mobile user NAME_PATTERN (no digits). */
  private static randomLetters(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  static generateUniqueUsername(): string {
    return `user_${this.suffix()}`;
  }

  static generateUniqueEmail(): string {
    return `user_${this.suffix()}@autotest.local`;
  }

  static generateUniqueMobile(): string {
    return `9${this.suffix().slice(-9).padStart(9, '0')}`;
  }

  static generateUniqueDorakuCode(): string {
    return `DK${this.suffix().slice(-8)}`;
  }

  static generateLongString(length: number): string {
    return 'A'.repeat(length);
  }

  static generateInvalidPhone(): string {
    return 'abc@#$phone';
  }

  static generateInvalidEmail(): string {
    return 'not-an-email';
  }

  static generateRandomName(): string {
    return `First${this.randomLetters(6)}`;
  }

  static generateRandomLastName(): string {
    return `Last${this.randomLetters(6)}`;
  }

  /** Meets PASSWORD_PATTERN: upper, lower, number, special, 8–15 chars. */
  static generateValidPassword(): string {
    return `Tt@${this.suffix().slice(-5)}`.slice(0, 15);
  }

  static generateWeakPassword(): string {
    return 'short';
  }
}
