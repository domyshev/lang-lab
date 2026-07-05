import { Box, Tooltip, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import {
  defaultAssistantId,
  getAssistantTooltip,
  resolveAssistantId,
} from '../domain/assistants';
import { CoachProgressMessage } from '../domain/coachProgress';
import { getCoachThought } from '../domain/coachThoughts';
import { t } from '../domain/i18n';
import { RootState } from '../store/store';
import { AssistantStickerIcon } from './assistantAssets';

export function CoachPanel({
  progressMessage,
  thoughtSeed,
}: {
  progressMessage?: CoachProgressMessage;
  thoughtSeed: number;
}) {
  const assistantId = useSelector((state: RootState) =>
    resolveAssistantId(state.app.assistantId ?? defaultAssistantId),
  );
  const interfaceLanguage = useSelector(
    (state: RootState) => state.app.interfaceLanguage,
  );
  const thought =
    progressMessage?.text ??
    getCoachThought(interfaceLanguage, thoughtSeed, assistantId);
  const thoughtTooltip = progressMessage?.tooltip ?? '';
  const assistantTooltip = getAssistantTooltip(assistantId, interfaceLanguage);

  return (
    <Box
      data-test="coach_panel__root"
      sx={{
        alignItems: 'flex-start',
        display: 'flex',
        gap: 1.5,
        justifyContent: 'flex-start',
        minHeight: { xs: 96, md: 118 },
        minWidth: 0,
      }}
    >
      <Tooltip describeChild title={assistantTooltip}>
        <Box
          component="span"
          data-test={`coach_panel__assistant_sticker_wrapper__${assistantId}`}
          sx={{ display: 'inline-flex' }}
        >
          <AssistantStickerIcon
            ariaLabel={assistantTooltip}
            assistantId={assistantId}
            className="coachPortrait"
            dataTest={`coach_panel__assistant_sticker__${assistantId}`}
            size={118}
            sx={{ height: { xs: 90, lg: 118 }, width: { xs: 90, lg: 118 } }}
          />
        </Box>
      </Tooltip>
      <Box
        aria-label={t(interfaceLanguage, 'coachThought')}
        data-test="coach_panel__thought_bubble"
        sx={{
          bgcolor: 'background.paper',
          border: '1px solid rgba(32, 48, 21, 0.18)',
          borderRadius: 2,
          boxShadow: '0 10px 22px rgba(32, 48, 21, 0.1)',
          maxWidth: 190,
          mt: 0.5,
          px: 1.5,
          py: 1,
          position: 'relative',
          '&::before': {
            bgcolor: 'background.paper',
            borderBottom: '1px solid rgba(32, 48, 21, 0.18)',
            borderLeft: '1px solid rgba(32, 48, 21, 0.18)',
            content: '""',
            height: 12,
            left: -7,
            position: 'absolute',
            top: 24,
            transform: 'rotate(45deg)',
            width: 12,
          },
        }}
      >
        <Tooltip describeChild title={thoughtTooltip}>
          <Typography
            data-test="coach_panel__thought_text"
            variant="body2"
            sx={{ fontWeight: 800, lineHeight: 1.35 }}
          >
            {thought}
          </Typography>
        </Tooltip>
      </Box>
    </Box>
  );
}
