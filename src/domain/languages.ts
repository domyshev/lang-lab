export const supportedLanguages = ['ru', 'en', 'es', 'uk'] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

export const languageLabels: Record<SupportedLanguage, string> = {
  ru: 'Русский',
  en: 'English',
  es: 'Español',
  uk: 'Українська',
};

export const languageFlags: Record<SupportedLanguage, string> = {
  ru: '🇷🇺',
  en: '🇬🇧',
  es: '🇪🇸',
  uk: '🇺🇦',
};

export function isSupportedLanguage(value: string): value is SupportedLanguage {
  return supportedLanguages.includes(value as SupportedLanguage);
}
