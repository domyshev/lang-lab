import { useEffect, useMemo, useState } from 'react';
import BackupOutlinedIcon from '@mui/icons-material/BackupOutlined';
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  ADMIN_API_TOKEN_STORAGE_KEY,
  DEFAULT_SERVER_ENDPOINT,
  ServerSyncError,
  createAdminBackup,
  loadAdminBackups,
  saveAdminBackupSettings,
  type BackupFilePayload,
  type BackupListResponse,
} from '../services/serverSyncClient';
import type { SupportedLanguage } from '../domain/languages';

export function AdminBackupView({
  interfaceLanguage,
}: {
  interfaceLanguage: SupportedLanguage;
}) {
  const copy = getAdminBackupCopy(interfaceLanguage);
  const [adminToken, setAdminToken] = useState(() =>
    window.localStorage.getItem(ADMIN_API_TOKEN_STORAGE_KEY) ?? '',
  );
  const [backupsState, setBackupsState] = useState<BackupListResponse | null>(
    null,
  );
  const [isEnabled, setIsEnabled] = useState(false);
  const [intervalHours, setIntervalHours] = useState(24);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const trimmedToken = adminToken.trim();
  const sortedBackups = useMemo(
    () => backupsState?.backups ?? [],
    [backupsState],
  );

  const refresh = async (token = trimmedToken) => {
    if (!token) {
      setError(copy.tokenRequired);
      return;
    }

    setIsLoading(true);
    setError('');
    setNotice('');
    try {
      const nextState = await loadAdminBackups({
        adminToken: token,
        endpoint: DEFAULT_SERVER_ENDPOINT,
      });
      setBackupsState(nextState);
      setIsEnabled(nextState.settings.enabled);
      setIntervalHours(nextState.settings.intervalHours);
    } catch (caught) {
      setError(getAdminError(caught));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!trimmedToken) {
      return;
    }
    void refresh(trimmedToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveToken = () => {
    if (!trimmedToken) {
      setError(copy.tokenRequired);
      return;
    }
    window.localStorage.setItem(ADMIN_API_TOKEN_STORAGE_KEY, trimmedToken);
    void refresh(trimmedToken);
  };

  const runBackup = async () => {
    if (!trimmedToken) {
      setError(copy.tokenRequired);
      return;
    }

    setIsLoading(true);
    setError('');
    setNotice('');
    try {
      const backup = await createAdminBackup({
        adminToken: trimmedToken,
        endpoint: DEFAULT_SERVER_ENDPOINT,
      });
      setNotice(`${copy.backupCreated}: ${backup.name}`);
      await refresh(trimmedToken);
    } catch (caught) {
      setError(getAdminError(caught));
    } finally {
      setIsLoading(false);
    }
  };

  const saveSchedule = async () => {
    if (!trimmedToken) {
      setError(copy.tokenRequired);
      return;
    }

    setIsLoading(true);
    setError('');
    setNotice('');
    try {
      const settings = await saveAdminBackupSettings({
        adminToken: trimmedToken,
        enabled: isEnabled,
        endpoint: DEFAULT_SERVER_ENDPOINT,
        intervalHours,
      });
      setBackupsState((current) =>
        current ? { ...current, settings } : { backups: [], settings },
      );
      setNotice(copy.scheduleSaved);
    } catch (caught) {
      setError(getAdminError(caught));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper
      data-test="admin_backup__panel"
      elevation={0}
      sx={{
        border: '1px solid rgba(32, 48, 21, 0.14)',
        maxWidth: 920,
        mx: 'auto',
        p: { xs: 2, md: 3 },
        width: '100%',
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography
            data-test="admin_backup__title"
            sx={{ color: '#203015', fontSize: 24, fontWeight: 950 }}
          >
            {copy.title}
          </Typography>
          <Typography
            data-test="admin_backup__subtitle"
            sx={{ color: 'text.secondary', fontSize: 14, mt: 0.5 }}
          >
            {copy.subtitle}
          </Typography>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}
        {notice && <Alert severity="success">{notice}</Alert>}

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          sx={{ alignItems: { xs: 'stretch', md: 'flex-end' } }}
        >
          <TextField
            data-test="admin_backup__token_input"
            label={copy.tokenLabel}
            onChange={(event) => setAdminToken(event.target.value)}
            size="small"
            type="password"
            value={adminToken}
            sx={{ flexGrow: 1 }}
          />
          <Button
            data-test="admin_backup__save_token_button"
            onClick={saveToken}
            startIcon={<SaveOutlinedIcon />}
            variant="outlined"
          >
            {copy.connect}
          </Button>
          <Button
            data-test="admin_backup__refresh_button"
            onClick={() => void refresh()}
            startIcon={<RefreshOutlinedIcon />}
            variant="outlined"
          >
            {copy.refresh}
          </Button>
        </Stack>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          sx={{ alignItems: { xs: 'stretch', md: 'center' } }}
        >
          <Button
            data-test="admin_backup__run_button"
            disabled={isLoading}
            onClick={runBackup}
            startIcon={
              isLoading ? <CircularProgress size={18} /> : <BackupOutlinedIcon />
            }
            sx={{ minHeight: 44 }}
            variant="contained"
          >
            {copy.createNow}
          </Button>
          <FormControlLabel
            control={
              <Checkbox
                checked={isEnabled}
                onChange={(event) => setIsEnabled(event.target.checked)}
              />
            }
            label={copy.scheduleEnabled}
          />
          <TextField
            data-test="admin_backup__interval_input"
            inputProps={{ min: 1, max: 8760, step: 1 }}
            label={copy.intervalHours}
            onChange={(event) =>
              setIntervalHours(sanitizeIntervalHours(event.target.value))
            }
            size="small"
            type="number"
            value={intervalHours}
            sx={{ width: { xs: '100%', md: 180 } }}
          />
          <Button
            data-test="admin_backup__save_schedule_button"
            disabled={isLoading}
            onClick={saveSchedule}
            startIcon={<SaveOutlinedIcon />}
            variant="outlined"
          >
            {copy.saveSchedule}
          </Button>
        </Stack>

        {backupsState && (
          <Stack
            data-test="admin_backup__settings_summary"
            spacing={0.5}
            sx={{
              bgcolor: 'rgba(24, 119, 201, 0.06)',
              border: '1px solid rgba(24, 119, 201, 0.16)',
              p: 1.5,
            }}
          >
            <Typography sx={{ fontSize: 14, fontWeight: 800 }}>
              {copy.backupDir}: {backupsState.settings.backupDir}
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
              {copy.lastRun}: {formatDate(backupsState.settings.lastRunAt, copy.never)}
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
              {copy.nextRun}: {formatDate(backupsState.settings.nextRunAt, copy.notScheduled)}
            </Typography>
            {backupsState.settings.lastError && (
              <Typography sx={{ color: 'error.main', fontSize: 13 }}>
                {copy.lastError}: {backupsState.settings.lastError}
              </Typography>
            )}
          </Stack>
        )}

        <Stack spacing={1.25}>
          <Typography sx={{ color: '#203015', fontSize: 18, fontWeight: 900 }}>
            {copy.backups}
          </Typography>
          {sortedBackups.length === 0 ? (
            <Typography
              data-test="admin_backup__empty"
              sx={{ color: 'text.secondary', fontWeight: 650 }}
            >
              {copy.noBackups}
            </Typography>
          ) : (
            <Stack data-test="admin_backup__list" spacing={1}>
              {sortedBackups.map((backup) => (
                <BackupRow
                  backup={backup}
                  copy={copy}
                  key={backup.name}
                />
              ))}
            </Stack>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

function BackupRow({
  backup,
  copy,
}: {
  backup: BackupFilePayload;
  copy: ReturnType<typeof getAdminBackupCopy>;
}) {
  return (
    <Box
      data-test={`admin_backup__backup__${backup.name}`}
      sx={{
        border: '1px solid rgba(32, 48, 21, 0.12)',
        display: 'grid',
        gap: 0.5,
        gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr auto' },
        p: 1.25,
      }}
    >
      <Typography sx={{ fontWeight: 850, overflowWrap: 'anywhere' }}>
        {backup.name}
      </Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
        {formatDate(backup.createdAt, copy.unknownDate)}
      </Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
        {formatBytes(backup.sizeBytes)}
      </Typography>
      <Typography
        sx={{
          color: 'text.secondary',
          fontFamily: 'monospace',
          fontSize: 12,
          gridColumn: { md: '1 / -1' },
          overflowWrap: 'anywhere',
        }}
      >
        {backup.path}
      </Typography>
    </Box>
  );
}

function sanitizeIntervalHours(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 1;
  }
  return Math.min(8760, Math.max(1, Math.round(parsed)));
}

function formatDate(value: string | undefined, fallback: string): string {
  if (!value) {
    return fallback;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatBytes(value: number): string {
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function getAdminError(error: unknown): string {
  if (error instanceof ServerSyncError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unable to manage backups.';
}

function getAdminBackupCopy(language: SupportedLanguage) {
  if (language === 'ru') {
    return {
      backupCreated: 'Бэкап создан',
      backupDir: 'Папка бэкапов',
      backups: 'Бэкапы',
      connect: 'Подключить',
      createNow: 'Создать бэкап сейчас',
      intervalHours: 'Интервал, часов',
      lastError: 'Последняя ошибка',
      lastRun: 'Последний запуск',
      never: 'ещё не запускался',
      nextRun: 'Следующий запуск',
      noBackups: 'Бэкапов пока нет.',
      notScheduled: 'не запланирован',
      refresh: 'Обновить',
      saveSchedule: 'Сохранить расписание',
      scheduleEnabled: 'Автоматически по расписанию',
      scheduleSaved: 'Расписание сохранено',
      subtitle:
        'SQLite копируется локально в папку Docker-тома, рядом с рабочей базой.',
      title: 'Администрирование бэкапов',
      tokenLabel: 'Admin token',
      tokenRequired: 'Введите admin token.',
      unknownDate: 'дата неизвестна',
    };
  }

  return {
    backupCreated: 'Backup created',
    backupDir: 'Backup directory',
    backups: 'Backups',
    connect: 'Connect',
    createNow: 'Create backup now',
    intervalHours: 'Interval, hours',
    lastError: 'Last error',
    lastRun: 'Last run',
    never: 'never',
    nextRun: 'Next run',
    noBackups: 'No backups yet.',
    notScheduled: 'not scheduled',
    refresh: 'Refresh',
    saveSchedule: 'Save schedule',
    scheduleEnabled: 'Run automatically on schedule',
    scheduleSaved: 'Schedule saved',
    subtitle:
      'SQLite is copied locally into the Docker volume next to the live database.',
    title: 'Backup administration',
    tokenLabel: 'Admin token',
    tokenRequired: 'Enter the admin token.',
    unknownDate: 'unknown date',
  };
}
