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

import { describe, expect, it } from 'vitest';
import {
  appReducer,
  getComplementaryLanguageForTarget,
  getComplementaryLanguages,
  setComplementaryLanguagesForTarget,
  setInterfaceLanguage,
  setTargetLanguage,
} from '../appSlice';

describe('appSlice language preferences', () => {
  it('defaults to English interface language before onboarding chooses another one', () => {
    expect(appReducer(undefined, { type: 'test/init' }).interfaceLanguage).toBe(
      'en',
    );
  });

  it('stores ordered companion languages per target language', () => {
    const state = appReducer(
      undefined,
      setComplementaryLanguagesForTarget({
        complementaryLanguages: ['es', 'uk', 'ru'],
        targetLanguage: 'en',
      }),
    );

    expect(state.complementaryLanguages.en).toEqual(['es', 'uk', 'ru']);
    expect(getComplementaryLanguageForTarget(state.complementaryLanguages, 'en')).toBe(
      'es',
    );
  });

  it('keeps legacy single-language persisted values readable as arrays', () => {
    expect(getComplementaryLanguages({ en: 'es' }).en).toEqual(['es']);
  });

  it('keeps interface language independent from companion ordering', () => {
    const withCompanions = appReducer(
      undefined,
      setComplementaryLanguagesForTarget({
        complementaryLanguages: ['ru', 'es', 'uk'],
        targetLanguage: 'en',
      }),
    );
    const withRussianInterface = appReducer(
      withCompanions,
      setInterfaceLanguage('ru'),
    );
    const withSpanishTarget = appReducer(withRussianInterface, setTargetLanguage('es'));

    expect(withRussianInterface.complementaryLanguages.en).toEqual([
      'ru',
      'es',
      'uk',
    ]);
    expect(withSpanishTarget.complementaryLanguages.es).toContain('ru');
    expect(withSpanishTarget.complementaryLanguages.es).not.toContain('es');
  });

  it('defaults companion languages to every non-target language', () => {
    expect(getComplementaryLanguages().en).toEqual(['ru', 'es', 'uk']);
    expect(getComplementaryLanguages().ru).toEqual(['en', 'es', 'uk']);
  });

  it('does not allow removing every hint language for a target language', () => {
    const withOneHint = appReducer(
      undefined,
      setComplementaryLanguagesForTarget({
        complementaryLanguages: ['es'],
        targetLanguage: 'en',
      }),
    );
    const withEmptyAttempt = appReducer(
      withOneHint,
      setComplementaryLanguagesForTarget({
        complementaryLanguages: [],
        targetLanguage: 'en',
      }),
    );

    expect(withEmptyAttempt.complementaryLanguages.en).toEqual(['es']);
    expect(getComplementaryLanguages({ en: [] }).en).toEqual([
      'ru',
      'es',
      'uk',
    ]);
  });
});
