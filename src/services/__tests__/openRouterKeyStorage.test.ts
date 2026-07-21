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
  DEFAULT_OPENROUTER_MODEL_ID,
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

  it('loads and stores dynamic OpenRouter model ids', () => {
    const storage = createMemoryStorage();

    expect(DEFAULT_OPENROUTER_MODEL_ID).toBe('deepseek/deepseek-v4-flash');
    expect(loadOpenRouterModel(storage)).toBe(DEFAULT_OPENROUTER_MODEL_ID);

    saveOpenRouterModel('deepseek/deepseek-v4-flash', storage);
    expect(storage.getItem(OPENROUTER_MODEL_STORAGE_KEY)).toBe(
      'deepseek/deepseek-v4-flash',
    );
    expect(loadOpenRouterModel(storage)).toBe('deepseek/deepseek-v4-flash');

    saveOpenRouterModel('custom/provider-model', storage);
    expect(loadOpenRouterModel(storage)).toBe('custom/provider-model');

    saveOpenRouterModel('   ', storage);
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
