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
import type { WorldId } from '../domain/worlds';

interface GameHelpPanelProps {
  interfaceLanguage: SupportedLanguage;
  isInitiallyCollapsed: boolean;
  onAcknowledge: () => void;
  worldId: WorldId;
}

type HelpSlide = 'intro' | 'chat';

export function GameHelpPanel({
  interfaceLanguage,
  isInitiallyCollapsed,
  onAcknowledge,
  worldId,
}: GameHelpPanelProps) {
  const [slide, setSlide] = useState<HelpSlide>(
    isInitiallyCollapsed ? 'chat' : 'intro',
  );

  useEffect(() => {
    setSlide(isInitiallyCollapsed ? 'chat' : 'intro');
  }, [isInitiallyCollapsed]);

  const palette = getHelpPalette(worldId);
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
      color: palette.secondary,
      bg: palette.secondaryBg,
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
      color: '#b0451c',
      bg: '#fff1dd',
      icon: <AutoAwesomeIcon fontSize="small" />,
      key: 'gameHelpOwnTrainer' as const,
    },
  ];
  const chatRows = [
    {
      color: palette.primary,
      bg: palette.primaryBg,
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
      color: '#b0451c',
      bg: '#fff1dd',
      icon: <TuneIcon fontSize="small" />,
      key: 'gameHelpAiChatControl' as const,
    },
  ];
  const slideIndex = slide === 'intro' ? 0 : 1;

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
        border: `1px solid ${palette.border}`,
        borderRadius: '8px',
        boxShadow: palette.shadow,
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
              bgcolor: palette.primaryBg,
              border: `1px solid ${palette.border}`,
              borderRadius: '50%',
              color: palette.primary,
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
          <Stack data-test="game_help__intro_slide" spacing={1.5}>
            <HelpSlideTitle
              color={palette.primary}
              dataTest="game_help__intro_title"
            >
              {t(interfaceLanguage, 'gameHelpIntroTitle')}
            </HelpSlideTitle>
            <HelpRows rows={introRows} interfaceLanguage={interfaceLanguage} />
          </Stack>
        ) : (
          <Stack data-test="game_help__chat_slide" spacing={1.5}>
            <HelpSlideTitle
              color={palette.primary}
              dataTest="game_help__chat_title"
            >
              {t(interfaceLanguage, 'gameHelpAiChatTitle')}
            </HelpSlideTitle>
            <HelpRows rows={chatRows} interfaceLanguage={interfaceLanguage} />
          </Stack>
        )}
        <Stack
          data-test="game_help__pager"
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Button
            data-test="game_help__back_button"
            disabled={slideIndex === 0}
            variant="outlined"
            onClick={() => setSlide('intro')}
            sx={getHelpPagerButtonSx(palette)}
          >
            {t(interfaceLanguage, 'gameHelpBack')}
          </Button>
          <Typography
            data-test="game_help__page_indicator"
            sx={{
              color: '#53604b',
              fontSize: 13,
              fontWeight: 850,
            }}
          >
            {t(interfaceLanguage, 'gameHelpPage')} {slideIndex + 1} / 2
          </Typography>
          <Button
            data-test="game_help__next_button"
            disabled={slideIndex === 1}
            variant="outlined"
            onClick={showChatSlide}
            sx={getHelpPagerButtonSx(palette)}
          >
            {t(interfaceLanguage, 'gameHelpNext')}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

function HelpSlideTitle({
  children,
  color,
  dataTest,
}: {
  children: string;
  color: string;
  dataTest: string;
}) {
  return (
    <Typography
      data-test={dataTest}
      sx={{
        color,
        fontSize: 18,
        fontWeight: 950,
        lineHeight: 1.2,
      }}
    >
      {children}
    </Typography>
  );
}

function getHelpPalette(worldId: WorldId) {
  if (worldId === 'forest') {
    return {
      border: 'rgba(64, 116, 48, 0.18)',
      primary: '#2f6f43',
      primaryBg: '#eaf6df',
      secondary: '#287b7a',
      secondaryBg: '#e4f6f4',
      shadow: '0 10px 28px rgba(48, 98, 38, 0.08)',
    };
  }

  return {
    border: 'rgba(19, 75, 132, 0.18)',
    primary: '#145f9e',
    primaryBg: '#e7f3ff',
    secondary: '#c06b00',
    secondaryBg: '#fff3d8',
    shadow: '0 10px 28px rgba(19, 75, 132, 0.08)',
  };
}

function getHelpPagerButtonSx(palette: ReturnType<typeof getHelpPalette>) {
  return {
    bgcolor: palette.primaryBg,
    borderColor: palette.border,
    borderRadius: 2,
    boxShadow: '0 8px 18px rgba(23, 78, 105, 0.10)',
    color: palette.primary,
    fontWeight: 900,
    px: 2,
    textTransform: 'none',
    '&:hover': {
      bgcolor: palette.primaryBg,
      borderColor: palette.primary,
    },
  };
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
