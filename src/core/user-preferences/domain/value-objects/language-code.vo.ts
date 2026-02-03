/**
 * LanguageCode Value Object
 *
 * Represents the language preference with validation.
 * This is an immutable Value Object following DDD principles.
 */
export class LanguageCode {
  private static readonly SUPPORTED_LANGUAGES = [
    'pt-BR',
    'en-US',
    'es-ES',
    'fr-FR',
    'de-DE',
    'ja-JP',
    'zh-CN',
  ] as const;
  readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(value: string): LanguageCode {
    if (
      !LanguageCode.SUPPORTED_LANGUAGES.includes(
        value as (typeof LanguageCode.SUPPORTED_LANGUAGES)[number],
      )
    ) {
      throw new Error(
        `Unsupported language: ${value}. Supported languages: ${LanguageCode.SUPPORTED_LANGUAGES.join(', ')}`,
      );
    }
    return new LanguageCode(value);
  }

  static ptBR(): LanguageCode {
    return new LanguageCode('pt-BR');
  }

  static enUS(): LanguageCode {
    return new LanguageCode('en-US');
  }

  equals(other: LanguageCode): boolean {
    return this.value === other.value;
  }

  toJSON() {
    return this.value;
  }

  toString() {
    return this.value;
  }

  get locale(): string {
    return this.value;
  }
}
