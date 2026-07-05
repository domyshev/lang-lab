import { useEffect, useRef, useState } from 'react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EditNoteIcon from '@mui/icons-material/EditNote';
import SchoolIcon from '@mui/icons-material/School';
import ScienceIcon from '@mui/icons-material/Science';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Paper,
  Popper,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { t } from '../domain/i18n';
import { SupportedLanguage } from '../domain/languages';

interface GameHelpPanelProps {
  hasCoachmarkBeenShown: boolean;
  interfaceLanguage: SupportedLanguage;
  isInitiallyCollapsed: boolean;
  onAcknowledge: () => void;
  onCoachmarkShown: () => void;
}

export function GameHelpPanel({
  hasCoachmarkBeenShown,
  interfaceLanguage,
  isInitiallyCollapsed,
  onAcknowledge,
  onCoachmarkShown,
}: GameHelpPanelProps) {
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState(!isInitiallyCollapsed);
  const [isCoachmarkOpen, setIsCoachmarkOpen] = useState(false);

  useEffect(() => {
    if (isInitiallyCollapsed) {
      setExpanded(false);
    }
  }, [isInitiallyCollapsed]);

  const rows = [
    {
      color: '#2f7d9b',
      bg: '#e8f6fb',
      icon: <ScienceIcon fontSize="small" />,
      key: 'gameHelpLab' as const,
    },
    {
      color: '#8a5a12',
      bg: '#fff2cf',
      icon: <SportsEsportsIcon fontSize="small" />,
      key: 'gameHelpPlayer' as const,
    },
    {
      color: '#6f4fa6',
      bg: '#f3edff',
      icon: <EditNoteIcon fontSize="small" />,
      key: 'gameHelpVocabulary' as const,
    },
    {
      color: '#1f6f62',
      bg: '#e7f7f2',
      icon: <SchoolIcon fontSize="small" />,
      key: 'gameHelpTeacher' as const,
    },
    {
      color: '#9b445c',
      bg: '#fff0f4',
      icon: <AutoAwesomeIcon fontSize="small" />,
      key: 'gameHelpOwnTrainer' as const,
    },
  ];

  const handleGotIt = () => {
    setExpanded(false);
    onAcknowledge();
    if (!hasCoachmarkBeenShown) {
      onCoachmarkShown();
      setIsCoachmarkOpen(true);
    }
  };

  return (
    <>
      <Accordion
        data-test="game_help__accordion"
        expanded={expanded}
        onChange={(_, nextExpanded) => setExpanded(nextExpanded)}
        disableGutters
        slotProps={{ transition: { unmountOnExit: true } }}
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.92)',
          border: '1px solid',
          borderColor: isCoachmarkOpen
            ? 'rgba(37, 118, 150, 0.48)'
            : 'rgba(37, 118, 150, 0.16)',
          borderRadius: '8px',
          boxShadow: isCoachmarkOpen
            ? '0 0 0 5px rgba(37, 118, 150, 0.16), 0 16px 32px rgba(23, 78, 105, 0.14)'
            : '0 10px 28px rgba(23, 78, 105, 0.08)',
          maxWidth: 760,
          mx: 'auto',
          overflow: 'hidden',
          transition: 'box-shadow 180ms ease, border-color 180ms ease',
          width: '100%',
          '&:before': { display: 'none' },
        }}
      >
        <AccordionSummary
          data-test="game_help__summary"
          expandIcon={<ExpandMoreIcon data-test="game_help__expand_icon" />}
          ref={summaryRef}
          sx={{
            '& .MuiAccordionSummary-content': {
              alignItems: 'center',
              gap: 1,
            },
          }}
        >
          <Box
            aria-hidden="true"
            data-test="game_help__title_icon"
            sx={{
              alignItems: 'center',
              bgcolor: '#e8f6fb',
              border: '1px solid rgba(37, 118, 150, 0.20)',
              borderRadius: '50%',
              color: '#174e69',
              display: 'inline-flex',
              height: 34,
              justifyContent: 'center',
              width: 34,
            }}
          >
            <AutoAwesomeIcon fontSize="small" />
          </Box>
          <Typography data-test="game_help__title" fontWeight={900}>
            {t(interfaceLanguage, 'gameHelpTitle')}
          </Typography>
        </AccordionSummary>
        <AccordionDetails data-test="game_help__details">
          <Stack data-test="game_help__content" spacing={2}>
            <Stack data-test="game_help__rows" spacing={1.25}>
              {rows.map((row) => (
                <Stack
                  data-test={`game_help__row__${row.key}`}
                  key={row.key}
                  direction="row"
                  spacing={1.25}
                  alignItems="flex-start"
                >
                  <Box
                    aria-hidden="true"
                    data-test={`game_help__row_icon__${row.key}`}
                    sx={{
                      alignItems: 'center',
                      bgcolor: row.bg,
                      border: `1px solid ${row.color}26`,
                      borderRadius: 1.5,
                      color: row.color,
                      display: 'inline-flex',
                      flexShrink: 0,
                      height: 22,
                      justifyContent: 'center',
                      mt: 0.1,
                      width: 22,
                      '& .MuiSvgIcon-root': {
                        fontSize: 15,
                      },
                    }}
                  >
                    {row.icon}
                  </Box>
                  <Typography data-test={`game_help__row_text__${row.key}`}>
                    {t(interfaceLanguage, row.key)}
                  </Typography>
                </Stack>
              ))}
            </Stack>

            <Button
              data-test="game_help__got_it_button"
              variant="outlined"
              onClick={handleGotIt}
              sx={{
                alignSelf: 'flex-start',
                bgcolor: '#f5fbff',
                borderColor: 'rgba(37, 118, 150, 0.38)',
                borderRadius: 2,
                boxShadow: '0 8px 18px rgba(23, 78, 105, 0.12)',
                color: '#174e69',
                fontWeight: 900,
                px: 2,
                '&:hover': {
                  bgcolor: '#e9f6fb',
                  borderColor: 'rgba(37, 118, 150, 0.52)',
                },
              }}
            >
              {t(interfaceLanguage, 'gameHelpGotIt')}
            </Button>
          </Stack>
        </AccordionDetails>
      </Accordion>

      <Popper
        data-test="game_help__coachmark_popper"
        open={isCoachmarkOpen}
        anchorEl={summaryRef.current}
        placement="bottom-start"
        modifiers={[{ name: 'offset', options: { offset: [0, 8] } }]}
        sx={{ zIndex: (theme) => theme.zIndex.modal }}
      >
        <Paper
          data-test="game_help__coachmark_surface"
          sx={{
            bgcolor: '#f5fbff',
            border: '1px solid rgba(37, 118, 150, 0.28)',
            borderRadius: 2,
            boxShadow: '0 18px 38px rgba(23, 78, 105, 0.18)',
            maxWidth: 330,
            p: 1.5,
          }}
        >
          <Stack
            data-test="game_help__coachmark"
            role="dialog"
            aria-label={t(interfaceLanguage, 'gameHelpCoachmarkTitle')}
            spacing={1.25}
          >
            <Stack
              data-test="game_help__coachmark_title_row"
              direction="row"
              spacing={0.75}
              alignItems="center"
            >
              <Box
                aria-hidden="true"
                data-test="game_help__coachmark_icon"
                sx={{
                  alignItems: 'center',
                  bgcolor: '#0f6d7a',
                  borderRadius: '50%',
                  color: '#ffd166',
                  display: 'inline-flex',
                  height: 24,
                  justifyContent: 'center',
                  width: 24,
                }}
              >
                <TipsAndUpdatesIcon sx={{ fontSize: 16 }} />
              </Box>
              <Typography
                data-test="game_help__coachmark_title"
                sx={{
                  color: '#174e69',
                  fontSize: 13,
                  fontWeight: 900,
                  lineHeight: 1.2,
                }}
              >
                {t(interfaceLanguage, 'gameHelpCoachmarkTitle')}
              </Typography>
            </Stack>
            <Stack data-test="game_help__coachmark_items" spacing={0.75}>
              <CoachmarkItem
                body={t(interfaceLanguage, 'gameHelpCoachmarkReturnBody')}
                dataTest="game_help__coachmark_item__return"
                title={t(interfaceLanguage, 'gameHelpCoachmarkReturnTitle')}
              />
              <CoachmarkItem
                body={t(interfaceLanguage, 'gameHelpCoachmarkSmartBody')}
                dataTest="game_help__coachmark_item__smart"
                title={t(interfaceLanguage, 'gameHelpCoachmarkSmartTitle')}
              />
            </Stack>
            <Button
              data-test="game_help__coachmark_close_button"
              size="small"
              variant="outlined"
              onClick={() => setIsCoachmarkOpen(false)}
              sx={{ alignSelf: 'flex-start' }}
            >
              {t(interfaceLanguage, 'tutorialClose')}
            </Button>
          </Stack>
        </Paper>
      </Popper>
    </>
  );
}

function CoachmarkItem({
  body,
  dataTest,
  title,
}: {
  body: string;
  dataTest: string;
  title: string;
}) {
  return (
    <Stack
      data-test={dataTest}
      direction="row"
      spacing={0.75}
      alignItems="flex-start"
    >
      <Box
        aria-hidden="true"
        data-test={`${dataTest}__dot`}
        sx={{
          bgcolor: '#ffd166',
          borderRadius: '50%',
          flexShrink: 0,
          height: 7,
          mt: 0.65,
          width: 7,
        }}
      />
      <Box data-test={`${dataTest}__text`}>
        <Typography
          data-test={`${dataTest}__title`}
          sx={{
            color: '#174e69',
            fontSize: 12,
            fontWeight: 850,
            lineHeight: 1.25,
          }}
        >
          {title}
        </Typography>
        <Typography
          data-test={`${dataTest}__body`}
          sx={{
            color: '#426579',
            fontSize: 12,
            lineHeight: 1.3,
          }}
        >
          {body}
        </Typography>
      </Box>
    </Stack>
  );
}
