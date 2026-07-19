import { describe, expect, it } from 'vitest';
import {
  DEFAULT_OPENROUTER_MODEL_ID,
  OPENROUTER_AVAILABLE_MODELS,
  loadOpenRouterKey,
  OPENROUTER_KEY_STORAGE_KEY,
  OPENROUTER_MODEL_STORAGE_KEY,
  loadOpenRouterModel,
  removeOpenRouterKey,
  saveOpenRouterModel,
  saveOpenRouterKey,
} from '../openRouterKeyStorage';

describe('openRouterKeyStorage', () => {
  it('loads an empty key when no browser override exists', () => {
    const storage = createMemoryStorage();

    expect(loadOpenRouterKey(storage)).toBe('');
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
  });

  it('removes the active key explicitly or when saving a blank value', () => {
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

  it('loads and stores only supported OpenRouter model ids', () => {
    const storage = createMemoryStorage();

    expect(DEFAULT_OPENROUTER_MODEL_ID).toBe('deepseek/deepseek-v4-flash');
    expect(OPENROUTER_AVAILABLE_MODELS.map(({ id }) => id)).toEqual([
      'deepseek/deepseek-chat-v3.1',
      'deepseek/deepseek-v4-flash',
      'deepseek/deepseek-v4-pro',
      'z-ai/glm-4.5',
      'openai/gpt-5.5',
      'moonshotai/kimi-k2',
      'qwen/qwen3.6-35b-a3b',
      'qwen/qwen3.6-flash',
      'qwen/qwen3.7-max',
      'qwen/qwen3.7-plus',
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
