export const LANGUAGES = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
  ru: 'Русский',
  tr: 'Türkçe',
} as const;

export type Lang = keyof typeof LANGUAGES;

export const DEFAULT_LANG: Lang = 'en';

// For Phase 4 - translations will be loaded from JSON files
// For now, use English strings directly
export function t(key: string, lang: Lang = DEFAULT_LANG): string {
  // TODO: implement full i18n in Phase 4
  return key;
}
