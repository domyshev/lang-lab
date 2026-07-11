import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';
import { PlannedAiOperation } from '../../domain/aiOperations';
import { t } from '../../domain/i18n';
import { SupportedLanguage } from '../../domain/languages';

const countItems = [
  ['createdCards', 'aiCreatedCards'],
  ['updatedCards', 'aiUpdatedCards'],
  ['pendingDuplicates', 'aiPendingDuplicates'],
  ['createdCardSets', 'aiCreatedCardSets'],
  ['renamedCardSets', 'aiRenamedCardSets'],
  ['membershipAdditions', 'aiMembershipAdditions'],
  ['membershipRemovals', 'aiMembershipRemovals'],
] as const;

interface AiOperationPreviewProps {
  blockingError?: string;
  language: SupportedLanguage;
  onApply: () => void;
  onCancel: () => void;
  operation: PlannedAiOperation;
}

export function AiOperationPreview({
  blockingError,
  language,
  onApply,
  onCancel,
  operation,
}: AiOperationPreviewProps) {
  return (
    <Paper
      data-test="ai_operation_preview__panel"
      variant="outlined"
      sx={{ borderColor: '#d8b968', bgcolor: '#fffdf5', p: 2 }}
    >
      <Stack data-test="ai_operation_preview__content" spacing={1.5}>
        <div data-test="ai_operation_preview__header">
          <Typography data-test="ai_operation_preview__title" component="h4" variant="subtitle1" fontWeight={900}>
            {operation.title}
          </Typography>
          <Typography data-test="ai_operation_preview__summary" color="text.secondary" variant="body2">
            {operation.summary}
          </Typography>
        </div>

        <Box
          data-test="ai_operation_preview__counts"
          sx={{
            display: 'grid',
            gap: 1,
            gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))' },
          }}
        >
          {countItems.map(([key, labelKey]) => (
            <Box
              data-test={`ai_operation_preview__count__${key}`}
              key={key}
              sx={{ borderLeft: '3px solid #6f4fa6', minWidth: 0, pl: 1 }}
            >
              <Typography fontWeight={900}>{operation.previewCounts[key]}</Typography>
              <Typography color="text.secondary" variant="caption">
                {t(language, labelKey)}
              </Typography>
            </Box>
          ))}
        </Box>

        {blockingError && (
          <Alert data-test="ai_operation_preview__blocking_error" severity="error">
            {t(language, 'aiOperationBlocked')}
          </Alert>
        )}

        <Stack data-test="ai_operation_preview__actions" direction="row" spacing={1}>
          <Button
            data-test="ai_operation_preview__apply_button"
            disabled={Boolean(blockingError)}
            onClick={onApply}
            variant="contained"
          >
            {t(language, 'aiApplyChanges')}
          </Button>
          <Button
            data-test="ai_operation_preview__cancel_button"
            onClick={onCancel}
            variant="outlined"
          >
            {t(language, 'aiCancelPreview')}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
