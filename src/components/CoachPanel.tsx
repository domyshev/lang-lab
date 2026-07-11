import { Box, Stack, Tooltip, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
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
  const theme = useTheme();
  const isNarrowAssistantLayout = useMediaQuery(theme.breakpoints.down('md'));
  const assistantTooltipPlacement = isNarrowAssistantLayout ? 'right' : 'left';
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
        anchorOrigin={
          isNarrowAssistantLayout ? 'triggerCenterRight' : 'triggerCenterLeft'
        }
        arrowDataTest="coach_panel__assistant_tooltip_arrow"
        closeOnOtherOpen
        hideArrow
        placement={assistantTooltipPlacement}
        preventOverflow
        title={
          <Stack
            data-test="coach_panel__assistant_tooltip"
            spacing={0.75}
            sx={{ bgcolor: 'transparent' }}
          >
            <Typography
              data-test="coach_panel__assistant_tooltip_title"
              sx={{ color: '#4b3a70', fontSize: 16, fontWeight: 950 }}
            >
              {assistantName}
            </Typography>
            <Typography
              data-test="coach_panel__assistant_tooltip_motto"
              sx={{
                color: 'rgba(75, 58, 112, 0.78)',
                fontSize: 14,
                fontStyle: 'italic',
                lineHeight: 1.35,
              }}
            >
              {assistantMotto}
            </Typography>
            <Box aria-hidden="true" sx={{ height: 4 }} />
            <Box
              component="button"
              data-test="coach_panel__assistant_profile_link"
              type="button"
              onClick={(event) => {
                event.preventDefault();
                onAssistantOpen?.(assistantId);
              }}
              sx={{
                alignSelf: 'flex-start',
                background:
                  'linear-gradient(135deg, #fff3a5 0%, #ffe27a 42%, #d7c6ff 100%)',
                border: '1.5px solid rgba(123, 95, 196, 0.42)',
                borderRadius: '18px 12px 18px 8px',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.82), 0 8px 16px rgba(73, 48, 124, 0.13)',
                color: '#5b3fc0',
                cursor: 'pointer',
                fontFamily:
                  '"Trebuchet MS", "Verdana", "Arial", sans-serif',
                fontSize: 13.5,
                fontWeight: 900,
                lineHeight: 1.1,
                mt: 0.25,
                px: 1.25,
                py: 0.75,
                textAlign: 'left',
                transform: 'rotate(-1deg)',
                transition:
                  'transform 160ms ease, box-shadow 160ms ease, filter 160ms ease',
                '&:hover': {
                  boxShadow:
                    'inset 0 1px 0 rgba(255,255,255,0.9), 0 10px 20px rgba(73, 48, 124, 0.18)',
                  filter: 'brightness(1.04)',
                  transform: 'rotate(0deg) translateY(-1px)',
                },
              }}
            >
              {t(interfaceLanguage, 'assistantProfileLink')}
            </Box>
          </Stack>
        }
        tooltipSx={getAssistantTooltipStyles(isNarrowAssistantLayout)}
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

function getAssistantTooltipStyles(isNarrow: boolean) {
  return {
    background:
      'linear-gradient(135deg, #fffaf0 0%, #fff7c7 48%, #f4edff 100%)',
    border: '1px solid rgba(123, 95, 196, 0.24)',
    borderRadius: '24px 18px 24px 10px',
    boxShadow:
      '0 14px 30px rgba(73, 48, 124, 0.16), inset 0 0 0 1px rgba(255, 255, 255, 0.58)',
    color: '#4b3a70',
    maxWidth: 320,
    overflow: 'visible',
    position: 'relative',
    px: 1.75,
    py: 1.35,
    '&::before': {
      bgcolor: '#ffe27a',
      border: '1px solid rgba(123, 95, 196, 0.18)',
      borderRadius: '999px',
      boxShadow: '0 5px 12px rgba(73, 48, 124, 0.10)',
      content: '""',
      height: 10,
      left: isNarrow ? -9 : 'auto',
      position: 'absolute',
      right: isNarrow ? 'auto' : -9,
      top: 'calc(50% - 2px)',
      width: 10,
    },
    '&::after': {
      bgcolor: '#b99cff',
      border: '1px solid rgba(123, 95, 196, 0.14)',
      borderRadius: '999px',
      boxShadow: '0 4px 10px rgba(73, 48, 124, 0.08)',
      content: '""',
      height: 7,
      left: isNarrow ? -18 : 'auto',
      position: 'absolute',
      right: isNarrow ? 'auto' : -18,
      top: 'calc(50% + 10px)',
      width: 7,
    },
  };
}
