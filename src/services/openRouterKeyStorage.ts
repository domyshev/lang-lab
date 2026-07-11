export const OPENROUTER_KEY_STORAGE_KEY =
  'language-crossword-lab:openrouter-api-key:v1';

export function loadOpenRouterKey(storage: Storage = window.localStorage): string {
  return storage.getItem(OPENROUTER_KEY_STORAGE_KEY)?.trim() ?? '';
}

export function saveOpenRouterKey(
  value: string,
  storage: Storage = window.localStorage,
) {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    removeOpenRouterKey(storage);
    return;
  }

  storage.setItem(OPENROUTER_KEY_STORAGE_KEY, trimmedValue);
}

export function removeOpenRouterKey(storage: Storage = window.localStorage) {
  storage.removeItem(OPENROUTER_KEY_STORAGE_KEY);
}
