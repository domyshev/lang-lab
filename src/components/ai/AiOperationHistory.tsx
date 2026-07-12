import HistoryIcon from '@mui/icons-material/History';
import UndoIcon from '@mui/icons-material/Undo';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { AiRollbackConflict, AppliedAiOperation } from '../../domain/aiOperations';
import { t } from '../../domain/i18n';
import { SupportedLanguage } from '../../domain/languages';

interface AiOperationHistoryProps {
  containerSx?: Record<string, unknown>;
  conflict: AiRollbackConflict | null;
  language: SupportedLanguage;
  onCloseConflict: () => void;
  onRollback: (operation: AppliedAiOperation) => void;
  operationError?: string;
  operations: AppliedAiOperation[];
  showHeader?: boolean;
}

export function AiOperationHistory({
  containerSx,
  conflict,
  language,
  onCloseConflict,
  onRollback,
  operationError,
  operations,
  showHeader = true,
}: AiOperationHistoryProps) {
  return (
    <Paper
      data-test="ai_operation_history__panel"
      variant="outlined"
      sx={{
        display: 'flex',
        height: { xs: 360, md: 560 },
        minHeight: 0,
        p: { xs: 1.5, sm: 2 },
        ...containerSx,
      }}
    >
      <Stack
        data-test="ai_operation_history__content"
        spacing={1.5}
        sx={{ flex: 1, minHeight: 0, width: '100%' }}
      >
        {showHeader && (
          <Stack data-test="ai_operation_history__header" direction="row" spacing={1} alignItems="center">
            <HistoryIcon color="action" />
            <Typography data-test="ai_operation_history__title" component="h3" variant="h6" fontWeight={800}>
              {t(language, 'aiHistoryTitle')}
            </Typography>
          </Stack>
        )}

        {operationError && (
          <Alert
            data-test="ai_operation_history__operation_error"
            severity="error"
          >
            {t(language, 'aiOperationHistoryError')}
          </Alert>
        )}

        {operations.length === 0 ? (
          <Typography data-test="ai_operation_history__empty" color="text.secondary">
            {t(language, 'aiHistoryEmpty')}
          </Typography>
        ) : (
          <Stack
            data-test="ai_operation_history__items"
            divider={<Divider flexItem />}
            spacing={1.5}
            sx={{ flex: 1, minHeight: 0 }}
          >
            <Stack
              data-test="ai_operation_history__scroll_area"
              divider={<Divider flexItem />}
              spacing={1.5}
              sx={{ flex: 1, minHeight: 0, overflowY: 'auto', pr: 0.5 }}
            >
            {operations.map((operation) => {
              const totalChanges = Object.values(operation.previewCounts).reduce(
                (total, value) => total + value,
                0,
              );
              return (
                <Box data-test={`ai_operation_history__item__${operation.id}`} key={operation.id}>
                  <Stack spacing={0.75}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                      <Typography fontWeight={800} sx={{ overflowWrap: 'anywhere' }}>
                        {operation.title}
                      </Typography>
                      <Chip
                        data-test={`ai_operation_history__status__${operation.id}`}
                        color={operation.status === 'applied' ? 'success' : 'default'}
                        label={t(language, operation.status === 'applied' ? 'aiApplied' : 'aiReverted')}
                        size="small"
                        variant="outlined"
                      />
                    </Stack>
                    <Typography color="text.secondary" variant="caption">
                      {new Intl.DateTimeFormat(language, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }).format(new Date(operation.appliedAt))}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      {operation.summary} · {totalChanges} {t(language, 'aiChanges')}
                    </Typography>
                    <Button
                      data-test={`ai_operation_history__rollback_button__${operation.id}`}
                      disabled={operation.status === 'reverted'}
                      onClick={() => onRollback(operation)}
                      size="small"
                      startIcon={<UndoIcon />}
                      sx={{ alignSelf: 'flex-start' }}
                    >
                      {t(language, 'aiRollback')}
                    </Button>
                  </Stack>
                </Box>
              );
            })}
            </Stack>
          </Stack>
        )}
      </Stack>

      <Dialog
        aria-labelledby="ai-rollback-conflict-title"
        data-test="ai_operation_history__conflict_dialog"
        onClose={onCloseConflict}
        open={Boolean(conflict)}
      >
        <DialogTitle id="ai-rollback-conflict-title">
          {t(language, 'aiRollbackConflictTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{t(language, 'aiRollbackConflictBody')}</DialogContentText>
          {conflict?.laterOperation && (
            <DialogContentText
              data-test="ai_operation_history__conflict_later_operation"
              sx={{ mt: 1 }}
            >
              {t(language, 'aiRollbackConflictLaterOperation')}{' '}
              {conflict.laterOperation.title}
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button data-test="ai_operation_history__conflict_close_button" onClick={onCloseConflict}>
            {t(language, 'close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
