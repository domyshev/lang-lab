// lang-lab — a language learning laboratory
// Copyright (C) 2026  Ilia Domyshev <ilia@domyshev.com>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published
// by the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

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
