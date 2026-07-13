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

  it('stores up to two companion languages per target language', () => {
    const state = appReducer(
      undefined,
      setComplementaryLanguagesForTarget({
        complementaryLanguages: ['es', 'uk', 'ru'],
        targetLanguage: 'en',
      }),
    );

    expect(state.complementaryLanguages.en).toEqual(['es', 'uk']);
    expect(getComplementaryLanguageForTarget(state.complementaryLanguages, 'en')).toBe(
      'es',
    );
  });

  it('keeps legacy single-language persisted values readable as arrays', () => {
    expect(getComplementaryLanguages({ en: 'es' }).en).toEqual(['es']);
  });

  it('removes companion languages that match the interface or target language', () => {
    const withCompanions = appReducer(
      undefined,
      setComplementaryLanguagesForTarget({
        complementaryLanguages: ['ru', 'es'],
        targetLanguage: 'en',
      }),
    );
    const withRussianInterface = appReducer(
      withCompanions,
      setInterfaceLanguage('ru'),
    );
    const withSpanishTarget = appReducer(withRussianInterface, setTargetLanguage('es'));

    expect(withRussianInterface.complementaryLanguages.en).toEqual(['es']);
    expect(withSpanishTarget.complementaryLanguages.es).not.toContain('ru');
    expect(withSpanishTarget.complementaryLanguages.es).not.toContain('es');
  });
});
