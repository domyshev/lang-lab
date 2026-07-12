import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import type { BlockedAiPreview } from '../../domain/aiBlockedPreview';
import { t } from '../../domain/i18n';
import type { SupportedLanguage } from '../../domain/languages';

interface AiBlockedOperationPreviewProps {
  language: SupportedLanguage;
  onCancel: () => void;
  preview: BlockedAiPreview;
}

export function AiBlockedOperationPreview({
  language,
  onCancel,
  preview,
}: AiBlockedOperationPreviewProps) {
  return (
    <Box
      data-test="ai_blocked_preview__panel"
      data-surface="purple-unframed"
      sx={{
        bgcolor: '#f5f0ff',
        borderRadius: 1,
        boxShadow: 'none',
        p: 2,
      }}
    >
      <Stack data-test="ai_blocked_preview__content" spacing={1.5}>
        <div data-test="ai_blocked_preview__header">
          <Typography
            data-test="ai_blocked_preview__title"
            component="h4"
            fontWeight={900}
            variant="subtitle1"
          >
            {preview.title ?? t(language, 'aiBlockedPreviewTitle')}
          </Typography>
          <Typography
            data-test="ai_blocked_preview__summary"
            color="text.secondary"
            variant="body2"
          >
            {preview.summary ?? t(language, 'aiBlockedPreviewSummary')}
          </Typography>
        </div>

        <Alert data-test="ai_blocked_preview__warnings" severity="warning">
          <Typography fontWeight={800} variant="body2">
            {t(language, 'aiBlockedPreviewWarnings')}
          </Typography>
          <Box component="ul" sx={{ mb: 0, mt: 0.75, pl: 2.5 }}>
            {preview.validationWarnings.map((warning, index) => (
              <Typography
                component="li"
                data-test={`ai_blocked_preview__warning__${index}`}
                key={`${warning}-${index}`}
                variant="body2"
              >
                {warning}
              </Typography>
            ))}
          </Box>
        </Alert>

        <Stack data-test="ai_blocked_preview__actions" direction="row" spacing={1}>
          <Button
            data-test="ai_blocked_preview__apply_button"
            disabled
            variant="contained"
          >
            {t(language, 'aiApplyChanges')}
          </Button>
          <Button
            data-test="ai_blocked_preview__cancel_button"
            onClick={onCancel}
            variant="outlined"
          >
            {t(language, 'aiCancelPreview')}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
