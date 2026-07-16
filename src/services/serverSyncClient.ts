import type { CardSet } from '../domain/cardSets';
import type { LanguageCard } from '../domain/cards';
import type { ExerciseAttempt } from '../domain/exercises';
import type { SupportedLanguage } from '../domain/languages';
import type { PracticeSettings } from '../domain/practiceOrdering';
import type { CardStats } from '../domain/stats';
import type { ComplementaryLanguages } from '../store/appSlice';
import type { AiAssistantMessage } from '../store/aiAssistantSlice';

export const SERVER_API_KEY_STORAGE_KEY = 'language-crossword-lab:server-api-key';
export const DEFAULT_SERVER_ENDPOINT =
  import.meta.env.VITE_LANG_LAB_API_ENDPOINT ?? 'http://127.0.0.1:8090';

export interface ServerStatePayload {
  attempts: ExerciseAttempt[];
  cards: LanguageCard[];
  cardSets: CardSet[];
  settings: ServerSettingsPayload;
  stats: CardStats[];
}

export interface ServerSettingsPayload {
  complementaryLanguages: ComplementaryLanguages;
  interfaceLanguage: SupportedLanguage;
  playerProfile?: {
    displayName?: string;
    isAnonymous: boolean;
  };
  practiceSettings: PracticeSettings;
  selectedCardSetId?: string;
  targetLanguage: SupportedLanguage;
}

export interface ServerUserPayload {
  uid: string;
  registeredAtUtc: string;
  revision: number;
}

export interface ServerStateResponse {
  revision: number;
  state: ServerStatePayload;
  user: ServerUserPayload;
}

export interface SaveServerStateResponse {
  revision: number;
}

export interface CreateServerUserResponse {
  apiKey: string;
  revision: number;
  user: ServerUserPayload;
}

export class ServerSyncError extends Error {
  status: number;
  currentRevision?: number;

  constructor(message: string, status: number, currentRevision?: number) {
    super(message);
    this.name = 'ServerSyncError';
    this.status = status;
    this.currentRevision = currentRevision;
  }
}

export function loadServerCredentials(storage: Storage = window.localStorage) {
  return {
    apiKey: storage.getItem(SERVER_API_KEY_STORAGE_KEY) ?? '',
    endpoint: DEFAULT_SERVER_ENDPOINT,
  };
}

export function saveServerCredentials(
  input: { apiKey: string },
  storage: Storage = window.localStorage,
) {
  storage.setItem(SERVER_API_KEY_STORAGE_KEY, input.apiKey);
}

export async function loadServerState(input: {
  apiKey: string;
  endpoint: string;
}): Promise<ServerStateResponse> {
  const response = await fetch(`${normalizeEndpoint(input.endpoint)}/api/state`, {
    headers: {
      'X-API-Key': input.apiKey,
    },
    method: 'GET',
  });
  return decodeResponse<ServerStateResponse>(response);
}

export async function saveServerState(input: {
  apiKey: string;
  baseRevision: number;
  endpoint: string;
  state: ServerStatePayload;
}): Promise<SaveServerStateResponse> {
  const response = await fetch(`${normalizeEndpoint(input.endpoint)}/api/state`, {
    body: JSON.stringify({
      baseRevision: input.baseRevision,
      state: input.state,
    }),
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': input.apiKey,
    },
    method: 'PUT',
  });
  return decodeResponse<SaveServerStateResponse>(response);
}

export async function loadChatMessages(input: {
  apiKey: string;
  endpoint: string;
}): Promise<AiAssistantMessage[]> {
  const response = await fetch(`${normalizeEndpoint(input.endpoint)}/api/chat`, {
    headers: {
      'X-API-Key': input.apiKey,
    },
    method: 'GET',
  });
  const data = await decodeResponse<{ messages: AiAssistantMessage[] }>(response);
  return data.messages;
}

export async function saveChatMessages(input: {
  apiKey: string;
  endpoint: string;
  messages: AiAssistantMessage[];
}): Promise<void> {
  const response = await fetch(`${normalizeEndpoint(input.endpoint)}/api/chat`, {
    body: JSON.stringify({ messages: input.messages }),
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': input.apiKey,
    },
    method: 'PUT',
  });
  await decodeResponse<{ ok: boolean }>(response);
}

export async function createServerUser(input: {
  endpoint: string;
  state: ServerStatePayload;
}): Promise<CreateServerUserResponse> {
  const response = await fetch(`${normalizeEndpoint(input.endpoint)}/api/users`, {
    body: JSON.stringify({
      state: input.state,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });
  return decodeResponse<CreateServerUserResponse>(response);
}

export function normalizeEndpoint(endpoint: string): string {
  return endpoint.trim().replace(/\/+$/, '');
}

async function decodeResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ServerSyncError(
      getErrorMessage(payload) || `Server responded with HTTP ${response.status}`,
      response.status,
      typeof payload.currentRevision === 'number'
        ? payload.currentRevision
        : undefined,
    );
  }
  return payload as T;
}

function getErrorMessage(payload: any): string | undefined {
  return typeof payload?.error === 'string' ? payload.error : undefined;
}
