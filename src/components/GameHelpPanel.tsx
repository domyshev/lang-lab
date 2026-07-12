import { useEffect, useState } from 'react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import SchoolIcon from '@mui/icons-material/School';
import ScienceIcon from '@mui/icons-material/Science';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import TuneIcon from '@mui/icons-material/Tune';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { t } from '../domain/i18n';
import { SupportedLanguage } from '../domain/languages';

interface GameHelpPanelProps {
  interfaceLanguage: SupportedLanguage;
  isInitiallyCollapsed: boolean;
  onAcknowledge: () => void;
}

type HelpSlide = 'intro' | 'chat';

export function GameHelpPanel({
  interfaceLanguage,
  isInitiallyCollapsed,
  onAcknowledge,
}: GameHelpPanelProps) {
  const [slide, setSlide] = useState<HelpSlide>(
    isInitiallyCollapsed ? 'chat' : 'intro',
  );

  useEffect(() => {
    setSlide(isInitiallyCollapsed ? 'chat' : 'intro');
  }, [isInitiallyCollapsed]);

  const introRows = [
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
  const chatRows = [
    {
      color: '#6845b8',
      bg: '#f1ecff',
      icon: <ChatBubbleOutlineIcon fontSize="small" />,
      key: 'gameHelpAiChatCards' as const,
    },
    {
      color: '#a05f00',
      bg: '#fff2d8',
      icon: <SportsEsportsIcon fontSize="small" />,
      key: 'gameHelpAiChatGames' as const,
    },
    {
      color: '#17716a',
      bg: '#e4f7f3',
      icon: <ManageSearchIcon fontSize="small" />,
      key: 'gameHelpAiChatStats' as const,
    },
    {
      color: '#8b436a',
      bg: '#fff0f7',
      icon: <TuneIcon fontSize="small" />,
      key: 'gameHelpAiChatControl' as const,
    },
  ];

  const showChatSlide = () => {
    setSlide('chat');
    onAcknowledge();
  };

  return (
    <Paper
      data-test="game_help__panel"
      elevation={0}
      sx={{
        bgcolor: 'rgba(255, 255, 255, 0.94)',
        border: '1px solid rgba(37, 118, 150, 0.16)',
        borderRadius: '8px',
        boxShadow: '0 10px 28px rgba(23, 78, 105, 0.08)',
        maxWidth: 760,
        mx: 'auto',
        overflow: 'hidden',
        p: { xs: 2, md: 2.5 },
        width: '100%',
      }}
    >
      <Stack data-test="game_help__content" spacing={2.25}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
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
          <Typography
            component="h1"
            data-test="game_help__title"
            sx={{ color: '#203015', fontSize: 24, fontWeight: 950, lineHeight: 1.1 }}
          >
            {t(interfaceLanguage, 'gameHelpTitle')}
          </Typography>
        </Stack>

        {slide === 'intro' ? (
          <Stack data-test="game_help__intro_slide" spacing={2}>
            <HelpRows rows={introRows} interfaceLanguage={interfaceLanguage} />
            <Button
              data-test="game_help__next_button"
              variant="outlined"
              onClick={showChatSlide}
              sx={{
                alignSelf: 'flex-start',
                bgcolor: '#f5fbff',
                borderColor: 'rgba(37, 118, 150, 0.38)',
                borderRadius: 2,
                boxShadow: '0 8px 18px rgba(23, 78, 105, 0.12)',
                color: '#174e69',
                fontWeight: 900,
                px: 2.5,
                textTransform: 'none',
                '&:hover': {
                  bgcolor: '#e9f6fb',
                  borderColor: 'rgba(37, 118, 150, 0.52)',
                },
              }}
            >
              {t(interfaceLanguage, 'gameHelpNext')}
            </Button>
          </Stack>
        ) : (
          <Stack data-test="game_help__chat_slide" spacing={1.5}>
            <Typography
              data-test="game_help__chat_title"
              sx={{
                color: '#6845b8',
                fontSize: 18,
                fontWeight: 950,
                lineHeight: 1.2,
              }}
            >
              {t(interfaceLanguage, 'gameHelpAiChatTitle')}
            </Typography>
            <HelpRows rows={chatRows} interfaceLanguage={interfaceLanguage} />
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

function HelpRows({
  interfaceLanguage,
  rows,
}: {
  interfaceLanguage: SupportedLanguage;
  rows: Array<{
    bg: string;
    color: string;
    icon: JSX.Element;
    key:
      | 'gameHelpLab'
      | 'gameHelpPlayer'
      | 'gameHelpVocabulary'
      | 'gameHelpTeacher'
      | 'gameHelpOwnTrainer'
      | 'gameHelpAiChatCards'
      | 'gameHelpAiChatGames'
      | 'gameHelpAiChatStats'
      | 'gameHelpAiChatControl';
  }>;
}) {
  return (
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
          <Typography
            data-test={`game_help__row_text__${row.key}`}
            sx={{ lineHeight: 1.35 }}
          >
            {t(interfaceLanguage, row.key)}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}
