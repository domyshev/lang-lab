import { Box, Link, Stack, Tooltip, Typography } from '@mui/material';
import { useSelector } from 'react-redux';
import {
  AssistantId,
  defaultAssistantId,
  getAssistantProfile,
  resolveAssistantId,
} from '../domain/assistants';
import { CoachProgressMessage } from '../domain/coachProgress';
import { getCoachThought } from '../domain/coachThoughts';
import { t } from '../domain/i18n';
import { RootState } from '../store/store';
import { AssistantStickerIcon } from './assistantAssets';
import { CursorAnchoredTooltip } from './CursorAnchoredTooltip';

export function CoachPanel({
  onAssistantOpen,
  progressMessage,
  thoughtSeed,
}: {
  onAssistantOpen?: (assistantId: AssistantId) => void;
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
  const assistant = getAssistantProfile(assistantId, interfaceLanguage);
  const assistantName = assistant.name[interfaceLanguage];
  const assistantMotto = assistant.motto[interfaceLanguage];
  const assistantTooltip = `${assistantName}: ${assistant.superpower[interfaceLanguage]}`;

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
      <CursorAnchoredTooltip
        arrowDataTest="coach_panel__assistant_tooltip_arrow"
        title={
          <Stack
            data-test="coach_panel__assistant_tooltip"
            spacing={0.75}
            sx={{ bgcolor: '#ffffff' }}
          >
            <Typography
              data-test="coach_panel__assistant_tooltip_title"
              sx={{ color: '#203015', fontSize: 16, fontWeight: 900 }}
            >
              {assistantName}
            </Typography>
            <Typography
              data-test="coach_panel__assistant_tooltip_motto"
              sx={{
                color: 'rgba(32, 48, 21, 0.78)',
                fontSize: 14,
                fontStyle: 'italic',
                lineHeight: 1.35,
              }}
            >
              {assistantMotto}
            </Typography>
            <Box aria-hidden="true" sx={{ height: 4 }} />
            <Link
              data-test="coach_panel__assistant_profile_link"
              href="#"
              onClick={(event) => {
                event.preventDefault();
                onAssistantOpen?.(assistantId);
              }}
              sx={{
                color: '#6f4bd8',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 850,
                textDecorationColor: 'rgba(111, 75, 216, 0.55)',
                '&:hover': { textDecoration: 'none' },
              }}
            >
              {t(interfaceLanguage, 'assistantProfileLink')}
            </Link>
          </Stack>
        }
        tooltipSx={assistantTooltipStyles}
      >
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
      </CursorAnchoredTooltip>
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

const assistantTooltipStyles = {
  bgcolor: '#ffffff',
  border: '1px solid rgba(32, 48, 21, 0.14)',
  boxShadow: '0 12px 28px rgba(32, 48, 21, 0.14)',
  color: '#203015',
  maxWidth: 300,
  p: 1.25,
};
