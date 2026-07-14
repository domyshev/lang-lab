import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useDispatch, useStore } from 'react-redux';
import {
  DEFAULT_SERVER_ENDPOINT,
  SERVER_API_KEY_STORAGE_KEY,
  SERVER_ENDPOINT_STORAGE_KEY,
  ServerSyncError,
  loadServerCredentials,
  loadServerState,
  normalizeEndpoint,
  saveServerCredentials,
  saveServerState,
} from '../services/serverSyncClient';
import {
  applyServerState,
  selectServerState,
  stableServerStateString,
} from '../store/serverState';
import type { AppDispatch, RootState } from '../store/store';

export {
  SERVER_API_KEY_STORAGE_KEY,
  SERVER_ENDPOINT_STORAGE_KEY,
} from '../services/serverSyncClient';

const SAVE_DEBOUNCE_MS = 600;

type ConnectionStatus = 'editing' | 'loading' | 'ready' | 'saving-error';

export function ServerDataGate({ children }: { children: ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const reduxStore = useStore<RootState>();
  const initialCredentials = useRef(loadServerCredentials());
  const [endpoint, setEndpoint] = useState(
    initialCredentials.current.endpoint || DEFAULT_SERVER_ENDPOINT,
  );
  const [apiKey, setApiKey] = useState(initialCredentials.current.apiKey);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<ConnectionStatus>(
    initialCredentials.current.apiKey ? 'loading' : 'editing',
  );
  const [connection, setConnection] = useState<{
    apiKey: string;
    endpoint: string;
  } | null>(null);
  const revisionRef = useRef(0);
  const lastSavedSnapshotRef = useRef('');

  const connect = useCallback(
    async (nextCredentials: { apiKey: string; endpoint: string }) => {
      const normalizedEndpoint = normalizeEndpoint(nextCredentials.endpoint);
      const trimmedApiKey = nextCredentials.apiKey.trim();
      if (!normalizedEndpoint || !trimmedApiKey) {
        setError('Server endpoint and API key are required.');
        setStatus('editing');
        return;
      }

      setStatus('loading');
      setError('');
      try {
        const response = await loadServerState({
          apiKey: trimmedApiKey,
          endpoint: normalizedEndpoint,
        });
        saveServerCredentials({
          apiKey: trimmedApiKey,
          endpoint: normalizedEndpoint,
        });
        applyServerState(dispatch, response.state);
        revisionRef.current = response.revision;
        lastSavedSnapshotRef.current = stableServerStateString(response.state);
        setEndpoint(normalizedEndpoint);
        setApiKey(trimmedApiKey);
        setConnection({ apiKey: trimmedApiKey, endpoint: normalizedEndpoint });
        setStatus('ready');
      } catch (caught) {
        setConnection(null);
        setError(getConnectionError(caught));
        setStatus('editing');
      }
    },
    [dispatch],
  );

  useEffect(() => {
    if (!initialCredentials.current.apiKey) {
      return;
    }
    void connect(initialCredentials.current);
  }, [connect]);

  useEffect(() => {
    if (status !== 'ready' || !connection) {
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
            apiKey: connection.apiKey,
            baseRevision: revisionRef.current,
            endpoint: connection.endpoint,
            state: stateToSave,
          });
          revisionRef.current = saved.revision;
          lastSavedSnapshotRef.current = stableServerStateString(stateToSave);
          if (queuedSnapshot !== lastSavedSnapshotRef.current) {
            scheduleSave();
          }
        } catch (caught) {
          setError(getConnectionError(caught));
          setStatus('saving-error');
          setConnection(null);
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
  }, [connection, reduxStore, status]);

  if (status === 'ready') {
    return <>{children}</>;
  }

  const isLoading = status === 'loading';

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
          maxWidth: 520,
          mx: 'auto',
          p: { xs: 2.5, sm: 3 },
          width: '100%',
        }}
      >
        <Stack spacing={2}>
          <Stack spacing={0.75}>
            <Typography
              component="h1"
              data-test="server_data_gate__title"
              sx={{ color: '#203015', fontSize: 26, fontWeight: 950 }}
            >
              Server connection required
            </Typography>
            <Typography
              data-test="server_data_gate__subtitle"
              sx={{ color: 'rgba(32, 48, 21, 0.72)', fontWeight: 650 }}
            >
              Language Lab stores cards, settings, and game history in the Go
              backend. Connect to continue.
            </Typography>
          </Stack>
          {error && (
            <Alert data-test="server_data_gate__error" severity="error">
              {error}
            </Alert>
          )}
          <TextField
            data-test="server_data_gate__endpoint_input"
            disabled={isLoading}
            fullWidth
            label="Server endpoint"
            onChange={(event) => setEndpoint(event.target.value)}
            value={endpoint}
          />
          <TextField
            data-test="server_data_gate__api_key_input"
            disabled={isLoading}
            fullWidth
            label="API key"
            onChange={(event) => setApiKey(event.target.value)}
            type="password"
            value={apiKey}
          />
          <Button
            data-test="server_data_gate__connect_button"
            disabled={isLoading}
            onClick={() => void connect({ apiKey, endpoint })}
            variant="contained"
            sx={{
              alignSelf: 'flex-start',
              bgcolor: '#315f2c',
              fontWeight: 900,
              textTransform: 'none',
              '&:hover': { bgcolor: '#244b20' },
            }}
          >
            {isLoading ? 'Connecting...' : 'Connect'}
          </Button>
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
