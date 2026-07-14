import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Box, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import { useDispatch, useStore } from 'react-redux';
import {
  DEFAULT_SERVER_ENDPOINT,
  SERVER_API_KEY_STORAGE_KEY,
  ServerSyncError,
  createServerUser,
  loadServerCredentials,
  loadServerState,
  saveServerCredentials,
  saveServerState,
  type ServerStatePayload,
} from '../services/serverSyncClient';
import {
  applyServerState,
  selectServerState,
  stableServerStateString,
} from '../store/serverState';
import type { AppDispatch, RootState } from '../store/store';

export { SERVER_API_KEY_STORAGE_KEY } from '../services/serverSyncClient';

const SAVE_DEBOUNCE_MS = 600;

export type ServerSyncStatus =
  | 'anonymous'
  | 'error'
  | 'loading'
  | 'ready'
  | 'registering';

export interface ServerSyncContextValue {
  apiToken: string;
  clearNewToken: () => void;
  createUser: (state: ServerStatePayload) => Promise<string>;
  endpoint: string;
  error?: string;
  lastCreatedToken: string;
  loginWithToken: (token: string) => Promise<void>;
  status: ServerSyncStatus;
}

const detachedServerSyncContext: ServerSyncContextValue = {
  apiToken: '',
  clearNewToken: () => {},
  createUser: async () => '',
  endpoint: DEFAULT_SERVER_ENDPOINT,
  lastCreatedToken: '',
  loginWithToken: async () => {},
  status: 'anonymous',
};

export const ServerSyncContext =
  createContext<ServerSyncContextValue>(detachedServerSyncContext);

export function useServerSync() {
  return useContext(ServerSyncContext);
}

export function ServerDataGate({ children }: { children: ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const reduxStore = useStore<RootState>();
  const initialCredentials = useRef(loadServerCredentials());
  const endpoint = initialCredentials.current.endpoint || DEFAULT_SERVER_ENDPOINT;
  const [apiToken, setApiToken] = useState(initialCredentials.current.apiKey);
  const [lastCreatedToken, setLastCreatedToken] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<ServerSyncStatus>(
    initialCredentials.current.apiKey ? 'loading' : 'anonymous',
  );
  const revisionRef = useRef(0);
  const lastSavedSnapshotRef = useRef('');

  const markLoaded = useCallback(
    (nextApiToken: string, revision: number, state: ServerStatePayload) => {
      revisionRef.current = revision;
      lastSavedSnapshotRef.current = stableServerStateString(state);
      setApiToken(nextApiToken);
      setStatus('ready');
      setError('');
    },
    [],
  );

  const loginWithToken = useCallback(
    async (token: string) => {
      const trimmedToken = token.trim();
      if (!trimmedToken) {
        throw new ServerSyncError('API token is required.', 401);
      }

      setStatus('loading');
      setError('');
      try {
        const response = await loadServerState({
          apiKey: trimmedToken,
          endpoint,
        });
        saveServerCredentials({ apiKey: trimmedToken });
        applyServerState(dispatch, response.state);
        setLastCreatedToken('');
        markLoaded(trimmedToken, response.revision, response.state);
      } catch (caught) {
        const message = getConnectionError(caught);
        setApiToken('');
        setError(message);
        setStatus('error');
        throw new ServerSyncError(message, getErrorStatus(caught));
      }
    },
    [dispatch, endpoint, markLoaded],
  );

  const createUser = useCallback(
    async (state: ServerStatePayload) => {
      setStatus('registering');
      setError('');
      try {
        const response = await createServerUser({ endpoint, state });
        saveServerCredentials({ apiKey: response.apiKey });
        setLastCreatedToken(response.apiKey);
        markLoaded(response.apiKey, response.revision, state);
        return response.apiKey;
      } catch (caught) {
        const message = getConnectionError(caught);
        setError(message);
        setStatus(apiToken ? 'ready' : 'anonymous');
        throw new ServerSyncError(message, getErrorStatus(caught));
      }
    },
    [apiToken, endpoint, markLoaded],
  );

  const clearNewToken = useCallback(() => {
    setLastCreatedToken('');
  }, []);

  useEffect(() => {
    if (!initialCredentials.current.apiKey) {
      return;
    }
    void loginWithToken(initialCredentials.current.apiKey);
  }, [loginWithToken]);

  useEffect(() => {
    if (status !== 'ready' || !apiToken) {
      return;
    }

    let saveTimer: ReturnType<typeof window.setTimeout> | undefined;
    let isSaving = false;
    let queuedSnapshot = '';

    const scheduleSave = () => {
      const serverState = selectServerState(reduxStore.getState());
      const nextSnapshot = stableServerStateString(serverState);
      if (nextSnapshot === lastSavedSnapshotRef.current) {
        return;
      }
      queuedSnapshot = nextSnapshot;
      if (saveTimer) {
        window.clearTimeout(saveTimer);
      }
      saveTimer = window.setTimeout(async () => {
        if (isSaving) {
          scheduleSave();
          return;
        }
        isSaving = true;
        try {
          const stateToSave = selectServerState(reduxStore.getState());
          const saved = await saveServerState({
            apiKey: apiToken,
            baseRevision: revisionRef.current,
            endpoint,
            state: stateToSave,
          });
          revisionRef.current = saved.revision;
          lastSavedSnapshotRef.current = stableServerStateString(stateToSave);
          if (queuedSnapshot !== lastSavedSnapshotRef.current) {
            scheduleSave();
          }
        } catch (caught) {
          setError(getConnectionError(caught));
          setStatus('error');
        } finally {
          isSaving = false;
        }
      }, SAVE_DEBOUNCE_MS);
    };

    const unsubscribe = reduxStore.subscribe(scheduleSave);
    scheduleSave();

    return () => {
      unsubscribe();
      if (saveTimer) {
        window.clearTimeout(saveTimer);
      }
    };
  }, [apiToken, endpoint, reduxStore, status]);

  const contextValue = useMemo<ServerSyncContextValue>(
    () => ({
      apiToken,
      clearNewToken,
      createUser,
      endpoint,
      error,
      lastCreatedToken,
      loginWithToken,
      status,
    }),
    [
      apiToken,
      clearNewToken,
      createUser,
      endpoint,
      error,
      lastCreatedToken,
      loginWithToken,
      status,
    ],
  );

  return (
    <ServerSyncContext.Provider value={contextValue}>
      {status === 'loading' && apiToken ? (
        <LoadingServerState />
      ) : (
        children
      )}
    </ServerSyncContext.Provider>
  );
}

function LoadingServerState() {
  return (
    <Box
      data-test="server_data_gate__root"
      sx={{
        alignItems: 'center',
        bgcolor: '#f6f7f2',
        display: 'flex',
        minHeight: '100vh',
        px: 2,
        py: 4,
      }}
    >
      <Paper
        data-test="server_data_gate__panel"
        elevation={0}
        sx={{
          border: '1px solid rgba(32, 48, 21, 0.16)',
          borderRadius: 2,
          boxShadow: '0 18px 42px rgba(32, 48, 21, 0.16)',
          maxWidth: 420,
          mx: 'auto',
          p: { xs: 2.5, sm: 3 },
          width: '100%',
        }}
      >
        <Stack spacing={1.5} sx={{ alignItems: 'center', textAlign: 'center' }}>
          <CircularProgress data-test="server_data_gate__loading_spinner" />
          <Typography
            data-test="server_data_gate__title"
            sx={{ color: '#203015', fontSize: 22, fontWeight: 950 }}
          >
            Loading server data
          </Typography>
          <Typography
            data-test="server_data_gate__subtitle"
            sx={{ color: 'rgba(32, 48, 21, 0.72)', fontWeight: 650 }}
          >
            Restoring your cards, settings, and game history from SQLite.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}

function getConnectionError(error: unknown): string {
  if (error instanceof ServerSyncError) {
    if (error.status === 409 && error.currentRevision !== undefined) {
      return `Server state changed before this client saved. Current revision: ${error.currentRevision}.`;
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unable to connect to the server.';
}

function getErrorStatus(error: unknown): number {
  if (error instanceof ServerSyncError) {
    return error.status;
  }
  return 0;
}
