import { describe, expect, it } from 'vitest';
import {
  DEFAULT_OPENROUTER_MODEL_ID,
  OPENROUTER_AVAILABLE_MODELS,
  loadOpenRouterKey,
  OPENROUTER_KEY_STORAGE_KEY,
  OPENROUTER_MODEL_STORAGE_KEY,
  OPENROUTER_TRIAL_KEY,
  OPENROUTER_TRIAL_KEY_DISABLED_STORAGE_KEY,
  loadOpenRouterModel,
  removeOpenRouterKey,
  restoreOpenRouterTrialKey,
  saveOpenRouterModel,
  saveOpenRouterKey,
} from '../openRouterKeyStorage';

describe('openRouterKeyStorage', () => {
  it('loads the built-in trial key when no browser override exists', () => {
    const storage = createMemoryStorage();

    expect(loadOpenRouterKey(storage)).toBe(OPENROUTER_TRIAL_KEY);
  });

  it('stores a trimmed key under the dedicated localStorage key', () => {
    const storage = createMemoryStorage();
    saveOpenRouterKey('  sk-or-test  ', storage);

    expect(OPENROUTER_KEY_STORAGE_KEY).toBe(
      'language-crossword-lab:openrouter-api-key:v1',
    );
    expect(storage.getItem(OPENROUTER_KEY_STORAGE_KEY)).toBe(
      'sk-or-test',
    );
    expect(loadOpenRouterKey(storage)).toBe('sk-or-test');
    expect(storage.getItem(OPENROUTER_TRIAL_KEY_DISABLED_STORAGE_KEY)).toBeNull();
  });

  it('removes the active key and disables the built-in trial key explicitly or when saving a blank value', () => {
    const storage = createMemoryStorage();
    saveOpenRouterKey('sk-or-test', storage);
    removeOpenRouterKey(storage);
    expect(loadOpenRouterKey(storage)).toBe('');
    expect(storage.getItem(OPENROUTER_TRIAL_KEY_DISABLED_STORAGE_KEY)).toBe('true');

    saveOpenRouterKey('sk-or-second', storage);
    saveOpenRouterKey('   ', storage);
    expect(loadOpenRouterKey(storage)).toBe('');
    expect(storage.getItem(OPENROUTER_TRIAL_KEY_DISABLED_STORAGE_KEY)).toBe('true');
  });

  it('can use an injected Storage implementation', () => {
    const storage = createMemoryStorage();

    saveOpenRouterKey(' custom-key ', storage);
    expect(loadOpenRouterKey(storage)).toBe('custom-key');
    removeOpenRouterKey(storage);
    expect(loadOpenRouterKey(storage)).toBe('');
  });

  it('restores the built-in trial key after a custom key or explicit delete', () => {
    const storage = createMemoryStorage();

    saveOpenRouterKey('custom-key', storage);
    removeOpenRouterKey(storage);
    expect(loadOpenRouterKey(storage)).toBe('');

    restoreOpenRouterTrialKey(storage);

    expect(loadOpenRouterKey(storage)).toBe(OPENROUTER_TRIAL_KEY);
    expect(storage.getItem(OPENROUTER_KEY_STORAGE_KEY)).toBeNull();
    expect(storage.getItem(OPENROUTER_TRIAL_KEY_DISABLED_STORAGE_KEY)).toBeNull();
  });

  it('loads and stores only supported OpenRouter model ids', () => {
    const storage = createMemoryStorage();

    expect(DEFAULT_OPENROUTER_MODEL_ID).toBe('openai/gpt-5.5');
    expect(OPENROUTER_AVAILABLE_MODELS.map(({ id }) => id)).toEqual([
      'openai/gpt-5.5',
      'deepseek/deepseek-v4-flash',
    ]);
    expect(loadOpenRouterModel(storage)).toBe(DEFAULT_OPENROUTER_MODEL_ID);

    saveOpenRouterModel('deepseek/deepseek-v4-flash', storage);
    expect(storage.getItem(OPENROUTER_MODEL_STORAGE_KEY)).toBe(
      'deepseek/deepseek-v4-flash',
    );
    expect(loadOpenRouterModel(storage)).toBe('deepseek/deepseek-v4-flash');

    saveOpenRouterModel('unknown/model', storage);
    expect(loadOpenRouterModel(storage)).toBe(DEFAULT_OPENROUTER_MODEL_ID);
  });
});

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    get length() {
      return values.size;
    },
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}
