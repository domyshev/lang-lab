import { describe, expect, it } from 'vitest';
import {
  loadOpenRouterKey,
  OPENROUTER_KEY_STORAGE_KEY,
  removeOpenRouterKey,
  saveOpenRouterKey,
} from '../openRouterKeyStorage';

describe('openRouterKeyStorage', () => {
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
  });

  it('removes the stored key explicitly or when saving a blank value', () => {
    const storage = createMemoryStorage();
    saveOpenRouterKey('sk-or-test', storage);
    removeOpenRouterKey(storage);
    expect(loadOpenRouterKey(storage)).toBe('');

    saveOpenRouterKey('sk-or-second', storage);
    saveOpenRouterKey('   ', storage);
    expect(loadOpenRouterKey(storage)).toBe('');
  });

  it('can use an injected Storage implementation', () => {
    const storage = createMemoryStorage();

    saveOpenRouterKey(' custom-key ', storage);
    expect(loadOpenRouterKey(storage)).toBe('custom-key');
    removeOpenRouterKey(storage);
    expect(loadOpenRouterKey(storage)).toBe('');
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
