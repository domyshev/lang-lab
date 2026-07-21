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

import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import type { BlockedAiPreview } from '../../domain/aiBlockedPreview';
import { t } from '../../domain/i18n';
import type { SupportedLanguage } from '../../domain/languages';

interface AiBlockedOperationPreviewProps {
  language: SupportedLanguage;
  onCancel: () => void;
  preview: BlockedAiPreview;
  status?: 'pending' | 'applied' | 'rejected';
}

export function AiBlockedOperationPreview({
  language,
  onCancel,
  preview,
  status = 'pending',
}: AiBlockedOperationPreviewProps) {
  const isPending = status === 'pending';

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
            disabled={!isPending}
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
