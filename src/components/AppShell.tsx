import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import MilitaryTechOutlinedIcon from '@mui/icons-material/MilitaryTechOutlined';
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import {
  AppBar,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Toolbar,
  Typography,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { t } from '../domain/i18n';
import { setPlayerProfile } from '../store/appSlice';
import { AppDispatch, RootState } from '../store/store';
import { AppLogo } from './AppLogo';
import { LanguageSelectors } from './LanguageSelectors';
import { createPlayerAvatarSeed, PlayerPixelAvatar } from './PlayerPixelAvatar';

export type AppShellSection =
  | 'game'
  | 'chat'
  | 'cards'
  | 'statistics'
  | 'help'
  | 'assistant';

interface AppShellProps {
  activeSection?: AppShellSection;
  children: ReactNode;
  onLogoClick?: () => void;
  onNavigate?: (section: AppShellSection) => void;
}

export function AppShell({
  activeSection = 'game',
  children,
  onLogoClick,
  onNavigate,
}: AppShellProps) {
  const interfaceLanguage = useSelector(
    (state: RootState) => state.app.interfaceLanguage,
  );
  const playerProfile = useSelector(
    (state: RootState) => state.app.playerProfile,
  );
  const completedGameCount = useSelector(
    (state: RootState & { attempts?: RootState['attempts'] }) =>
      state.attempts?.attempts.length ?? 0,
  );
  const dispatch = useDispatch<AppDispatch>();
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const tabValue = visibleTabSections.includes(activeSection)
    ? activeSection
    : false;

  useLayoutEffect(() => {
    if (scrollRootRef.current) {
      scrollRootRef.current.scrollTop = 0;
    }
  }, [activeSection]);

  return (
    <Box
      data-test="app_shell__root"
      ref={scrollRootRef}
      sx={{
        bgcolor: 'background.default',
        height: '100dvh',
        minHeight: '100vh',
        overscrollBehaviorY: 'none',
        overflowY: 'auto',
      }}
    >
      <AppBar
        data-test="app_shell__app_bar"
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: '#dcefb1',
          borderBottom: '1px solid rgba(32, 48, 21, 0.16)',
          color: '#203015',
          overscrollBehaviorY: 'none',
        }}
      >
        <Toolbar
          data-nowrap-breakpoint="1440px"
          data-test="app_shell__toolbar"
          sx={{
            alignItems: 'flex-start',
            columnGap: 1.25,
            rowGap: 1.25,
            flexWrap: 'wrap',
            minHeight: 'auto',
            py: 1.25,
            '@media (min-width: 1440px)': {
              alignItems: 'center',
              columnGap: 2,
              rowGap: 0,
              flexWrap: 'nowrap',
              minHeight: 70,
              py: 0,
            },
          }}
        >
          <Box
            data-test="app_shell__logo_slot"
            sx={{
              display: 'flex',
              flexBasis: '100%',
              justifyContent: 'flex-start',
              minWidth: 250,
              '@media (min-width: 1440px)': {
                flexBasis: 'auto',
              },
            }}
          >
            <AppLogo
              interfaceLanguage={interfaceLanguage}
              onClick={onLogoClick}
            />
          </Box>

          <Tabs
            data-wide-scroll-buttons="hidden-at-1440px"
            data-test="app_shell__main_tabs"
            value={tabValue}
            onChange={(_, value: AppShellSection) => onNavigate?.(value)}
            aria-label="Main sections"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              alignSelf: 'stretch',
              flexBasis: '100%',
              minHeight: 44,
              maxWidth: '100%',
              '@media (min-width: 1440px)': {
                alignSelf: 'auto',
                flexBasis: 'auto',
                maxWidth: 520,
                '& .MuiTabs-scrollButtons': {
                  display: 'none',
                },
              },
              '& .MuiTab-root': {
                color: 'inherit',
                minHeight: 44,
                px: { xs: 0.75, sm: 2 },
                textTransform: 'none',
                fontWeight: 800,
                '@media (min-width: 1440px)': {
                  px: 1,
                },
              },
              '& .MuiTabs-flexContainer': {
                gap: '10px',
              },
              '& .Mui-selected': {
                color: '#203015',
              },
              '& .MuiTabs-indicator': {
                bgcolor: '#203015',
                height: 3,
              },
            }}
          >
            <Tab
              data-test="app_shell__tab__game"
              value="game"
              label={t(interfaceLanguage, 'gamesTab')}
              onClick={() => onNavigate?.('game')}
              style={{
                backgroundColor: 'rgb(255, 247, 205)',
                borderRadius: '999px',
              }}
              sx={{
                border: '1px solid rgba(206, 157, 29, 0.34)',
                boxShadow:
                  'inset 0 1px 0 rgba(255,255,255,0.9), 0 0 0 4px rgba(255, 218, 96, 0.18)',
                color: '#203015',
                fontWeight: '950 !important',
                minHeight: '34px !important',
                minWidth: '0 !important',
                px: { xs: 1.25, sm: 2.25 },
                '&.Mui-selected': {
                  boxShadow:
                    'inset 0 1px 0 rgba(255,255,255,0.9), 0 0 0 5px rgba(255, 203, 74, 0.24)',
                  color: '#203015',
                },
              }}
            />
            <Tab
              data-test="app_shell__tab__chat"
              value="chat"
              icon={<SmartToyOutlinedIcon data-test="app_shell__tab_icon__chat" />}
              iconPosition="start"
              label={t(interfaceLanguage, 'aiChatTitle')}
              sx={{
                color: '#3a285f',
                minWidth: '0 !important',
                '& .MuiSvgIcon-root': {
                  fontSize: 19,
                },
              }}
            />
            <Tab
              data-test="app_shell__tab__cards"
              value="cards"
              label={t(interfaceLanguage, 'cards')}
              sx={{ minWidth: '0 !important' }}
            />
            <Tab
              data-test="app_shell__tab__statistics"
              value="statistics"
              label={t(interfaceLanguage, 'statistics')}
              sx={{ minWidth: '0 !important' }}
            />
            <Tab
              aria-label={t(interfaceLanguage, 'gameHelpTitle')}
              data-test="app_shell__tab__help"
              icon={<HelpOutlineIcon data-test="app_shell__tab_icon__help" />}
              value="help"
              sx={{ minWidth: '0 !important' }}
            />
          </Tabs>

          <Box
            data-test="app_shell__player_greeting_slot"
            sx={{
              alignItems: 'center',
              alignSelf: 'stretch',
              display: 'flex',
              flexGrow: 1,
              justifyContent: 'center',
              minWidth: { xs: 0, md: 260 },
              '@media (min-width: 1440px)': {
                alignSelf: 'center',
                minWidth: 240,
              },
            }}
          >
            {playerProfile && (
              <PlayerGreeting
                avatarSeed={playerProfile.avatarSeed}
                completedGameCount={completedGameCount}
                interfaceLanguage={interfaceLanguage}
                name={
                  playerProfile.isAnonymous
                    ? t(interfaceLanguage, 'playerAnonymousName')
                    : (playerProfile.displayName ?? t(interfaceLanguage, 'playerAnonymousName'))
                }
              />
            )}
          </Box>
          <Box
            data-test="app_shell__selectors_slot"
            sx={{
              display: 'flex',
              flexBasis: { xs: '100%', md: 'auto' },
              flexShrink: 0,
              justifyContent: 'flex-start',
              minWidth: 0,
            }}
          >
            <LanguageSelectors />
          </Box>
        </Toolbar>
      </AppBar>

      <Container
        component="main"
        data-test="app_shell__main_content"
        maxWidth="lg"
        sx={{ py: { xs: 2, md: 3 } }}
      >
        {children}
      </Container>

      <PlayerOnboardingDialog
        interfaceLanguage={interfaceLanguage}
        open={!playerProfile}
        onAnonymous={() =>
          dispatch(
            setPlayerProfile({
              avatarSeed: createPlayerAvatarSeed(''),
              isAnonymous: true,
            }),
          )
        }
        onSave={(name) =>
          dispatch(
            setPlayerProfile({
              avatarSeed: createPlayerAvatarSeed(name),
              displayName: name,
              isAnonymous: false,
            }),
          )
        }
      />
    </Box>
  );
}

function PlayerGreeting({
  avatarSeed,
  completedGameCount,
  interfaceLanguage,
  name,
}: {
  avatarSeed: string;
  completedGameCount: number;
  interfaceLanguage: RootState['app']['interfaceLanguage'];
  name: string;
}) {
  const playerLevel = getPlayerLevel(completedGameCount, interfaceLanguage);

  return (
    <Tooltip
      arrow
      title={
        <Box
          data-test="player_greeting__tooltip"
          sx={{
            bgcolor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(29, 26, 43, 0.98)'
                : 'rgba(255, 255, 255, 0.98)',
            color: (theme) =>
              theme.palette.mode === 'dark' ? '#f6f0ff' : '#203015',
            backgroundColor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(29, 26, 43, 0.98)'
                : 'rgba(255, 255, 255, 0.98)',
            fontSize: 14,
            fontWeight: 700,
            maxWidth: 310,
          }}
        >
          <Stack spacing={1.1}>
            <Stack
              data-test="player_greeting__level_summary"
              direction="row"
              spacing={1}
              sx={{
                alignItems: 'center',
                background:
                  'linear-gradient(135deg, rgba(255, 239, 164, 0.72), rgba(232, 246, 251, 0.92))',
                border: `1px solid ${playerLevel.color}55`,
                borderRadius: 2,
                p: 1,
              }}
            >
              <Box
                aria-hidden="true"
                data-test="player_greeting__level_icon"
                sx={{
                  alignItems: 'center',
                  bgcolor: playerLevel.bg,
                  border: `1px solid ${playerLevel.color}66`,
                  borderRadius: '50%',
                  color: playerLevel.color,
                  display: 'inline-flex',
                  flexShrink: 0,
                  height: 34,
                  justifyContent: 'center',
                  width: 34,
                  '& .MuiSvgIcon-root': {
                    fontSize: 20,
                  },
                }}
              >
                <PlayerLevelIcon index={playerLevel.index} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  data-test="player_greeting__level_title"
                  sx={{
                    color: '#203015',
                    fontSize: 15,
                    fontWeight: 950,
                    lineHeight: 1.15,
                  }}
                >
                  {playerLevel.title}
                </Typography>
                <Typography
                  data-test="player_greeting__level_count"
                  sx={{
                    color: '#5e6657',
                    fontSize: 13,
                    fontWeight: 850,
                    lineHeight: 1.2,
                  }}
                >
                  {formatCompletedGames(completedGameCount, interfaceLanguage)}
                </Typography>
              </Box>
            </Stack>
            <Typography
              data-test="player_greeting__tooltip_name"
              sx={{
                color: (theme) =>
                  theme.palette.mode === 'dark' ? '#f6f0ff' : '#203015',
                fontSize: 14,
                fontWeight: 900,
                lineHeight: 1.2,
              }}
            >
              {name}
            </Typography>
            <Typography
              data-test="player_greeting__level_explanation"
              sx={{
                color: (theme) =>
                  theme.palette.mode === 'dark' ? '#ded4f8' : '#53604b',
                fontSize: 14,
                lineHeight: 1.35,
              }}
            >
              {playerLevel.description}
            </Typography>
          </Stack>
        </Box>
      }
      slotProps={{
        arrow: {
          sx: {
            color: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(29, 26, 43, 0.98)'
                : 'rgba(255, 255, 255, 0.98)',
          },
        },
        tooltip: {
          sx: {
            bgcolor: (theme) =>
              theme.palette.mode === 'dark'
                ? 'rgba(29, 26, 43, 0.98)'
                : 'rgba(255, 255, 255, 0.98)',
            boxShadow: '0 10px 24px rgba(32, 45, 26, 0.16)',
            color: (theme) =>
              theme.palette.mode === 'dark' ? '#f6f0ff' : '#203015',
            fontSize: 14,
            fontWeight: 800,
            px: 1.5,
            py: 1,
          },
        },
      }}
    >
      <Stack
        data-test="player_greeting__root"
        direction="row"
        sx={{
          alignItems: 'center',
          alignSelf: 'center',
          bgcolor: 'rgba(255, 251, 226, 0.72)',
          border: '1px solid rgba(131, 88, 17, 0.18)',
          borderRadius: 999,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.74)',
          boxSizing: 'border-box',
          cursor: 'default',
          flexShrink: 0,
          justifyContent: 'center',
          maxWidth: 230,
          minHeight: 36,
          overflow: 'hidden',
          position: 'relative',
          py: 0,
          userSelect: 'none',
          width: 'fit-content',
        }}
      >
        <Box
          data-test="player_greeting__avatar_slot"
          sx={{
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'center',
            left: 6,
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
          }}
        >
          <PlayerPixelAvatar
            ariaLabel={name}
            dataTest="player_greeting__avatar"
            seed={avatarSeed}
            size={30}
          />
        </Box>
        <Typography
          data-test="player_greeting__label"
          noWrap
          sx={{
            color: '#203015',
            alignItems: 'center',
            cursor: 'default',
            display: 'flex',
            fontSize: 14,
            fontWeight: 950,
            justifyContent: 'center',
            lineHeight: 1,
            minWidth: 0,
            overflow: 'hidden',
            pl: 5,
            pr: 1.5,
            textAlign: 'center',
            textOverflow: 'ellipsis',
            textShadow: '0 1px 0 rgba(255,255,255,0.74)',
            whiteSpace: 'nowrap',
            width: '100%',
          }}
        >
          {name}
        </Typography>
      </Stack>
    </Tooltip>
  );
}

interface PlayerLevelView {
  bg: string;
  color: string;
  description: string;
  index: number;
  title: string;
}

const PLAYER_LEVEL_THRESHOLDS = [0, 30, 60, 100, 160, 250, 400] as const;

const playerLevelCopies: Record<
  RootState['app']['interfaceLanguage'],
  Array<Omit<PlayerLevelView, 'bg' | 'color' | 'index'>>
> = {
  en: [
    {
      title: 'Newcomer',
      description:
        'Your game level starts here: play a few more rounds and the lab will begin to see your learning rhythm.',
    },
    {
      title: 'Advanced newcomer',
      description:
        'Your game level already has momentum: you know the rules and are building a steady training trail.',
    },
    {
      title: 'Confident player',
      description:
        'Your game level shows stable practice: the library is becoming a tool you can actually steer.',
    },
    {
      title: 'Card collector',
      description:
        'Your game level says the vocabulary engine is warming up: sets, repeats, and results start working together.',
    },
    {
      title: 'Training strategist',
      description:
        'Your game level is tactical now: you have enough history to choose weaker cards with intent.',
    },
    {
      title: 'Language master',
      description:
        'Your game level is serious: the lab has enough games to make progress patterns visible.',
    },
    {
      title: 'Lab legend',
      description:
        'Your game level is legendary: this is no longer a warm-up, it is a personal language machine.',
    },
  ],
  ru: [
    {
      title: 'Новичок',
      description:
        'Игровой уровень начинается здесь: сыграй еще несколько игр, и лаборатория начнет видеть твой ритм обучения.',
    },
    {
      title: 'Продвинутый новичок',
      description:
        'Игровой уровень уже набирает ход: ты понял правила и прокладываешь стабильную тренировочную тропу.',
    },
    {
      title: 'Уверенный игрок',
      description:
        'Игровой уровень показывает устойчивую практику: библиотека становится инструментом, которым ты управляешь.',
    },
    {
      title: 'Собиратель карточек',
      description:
        'Игровой уровень говорит, что словарный двигатель прогрелся: наборы, повторы и результаты начинают работать вместе.',
    },
    {
      title: 'Стратег тренировки',
      description:
        'Игровой уровень уже тактический: истории достаточно, чтобы выбирать слабые карточки осознанно.',
    },
    {
      title: 'Мастер языков',
      description:
        'Игровой уровень серьезный: лаборатория накопила достаточно игр, чтобы видеть рисунок прогресса.',
    },
    {
      title: 'Легенда лаборатории',
      description:
        'Игровой уровень легендарный: это уже не разминка, а личная языковая машина.',
    },
  ],
  es: [
    {
      title: 'Principiante',
      description:
        'Tu nivel de juego empieza aqui: juega algunas rondas mas y el laboratorio vera tu ritmo de aprendizaje.',
    },
    {
      title: 'Principiante avanzado',
      description:
        'Tu nivel de juego ya tiene impulso: conoces las reglas y construyes una ruta de practica estable.',
    },
    {
      title: 'Jugador seguro',
      description:
        'Tu nivel de juego muestra practica constante: la biblioteca empieza a ser una herramienta que diriges.',
    },
    {
      title: 'Coleccionista de tarjetas',
      description:
        'Tu nivel de juego dice que el motor de vocabulario se calienta: conjuntos, repeticiones y resultados trabajan juntos.',
    },
    {
      title: 'Estratega de practica',
      description:
        'Tu nivel de juego ya es tactico: tienes historia suficiente para elegir tarjetas debiles con intencion.',
    },
    {
      title: 'Maestro de idiomas',
      description:
        'Tu nivel de juego es serio: el laboratorio tiene suficientes juegos para mostrar patrones de progreso.',
    },
    {
      title: 'Leyenda del laboratorio',
      description:
        'Tu nivel de juego es legendario: ya no es calentamiento, es tu maquina personal de idiomas.',
    },
  ],
};

const playerLevelColors = [
  { bg: '#eef7ff', color: '#2f7d9b' },
  { bg: '#fff5d7', color: '#9b6a12' },
  { bg: '#eef8e8', color: '#4d8a2f' },
  { bg: '#f3edff', color: '#6845b8' },
  { bg: '#fff0f7', color: '#9b445c' },
  { bg: '#ecf7f4', color: '#17716a' },
  { bg: '#fff0d8', color: '#b45f06' },
] as const;

function getPlayerLevel(
  completedGameCount: number,
  interfaceLanguage: RootState['app']['interfaceLanguage'],
): PlayerLevelView {
  const normalizedCount = Math.max(0, completedGameCount);
  let index = 0;
  for (const [levelIndex, threshold] of PLAYER_LEVEL_THRESHOLDS.entries()) {
    if (normalizedCount >= threshold) {
      index = levelIndex;
    }
  }
  const copy = playerLevelCopies[interfaceLanguage][index];
  const colors = playerLevelColors[index];

  return {
    ...copy,
    ...colors,
    index,
  };
}

function formatCompletedGames(
  completedGameCount: number,
  interfaceLanguage: RootState['app']['interfaceLanguage'],
): string {
  if (interfaceLanguage === 'ru') {
    return `${completedGameCount} пройдено игр`;
  }
  if (interfaceLanguage === 'es') {
    return `${completedGameCount} juegos completados`;
  }
  return `${completedGameCount} games completed`;
}

function PlayerLevelIcon({ index }: { index: number }) {
  switch (index) {
    case 0:
      return <SchoolOutlinedIcon />;
    case 1:
      return <ExploreOutlinedIcon />;
    case 2:
      return <RocketLaunchOutlinedIcon />;
    case 3:
      return <WorkspacePremiumOutlinedIcon />;
    case 4:
      return <PsychologyOutlinedIcon />;
    case 5:
      return <MilitaryTechOutlinedIcon />;
    default:
      return <EmojiEventsOutlinedIcon />;
  }
}

function PlayerOnboardingDialog({
  interfaceLanguage,
  onAnonymous,
  onSave,
  open,
}: {
  interfaceLanguage: RootState['app']['interfaceLanguage'];
  onAnonymous: () => void;
  onSave: (name: string) => void;
  open: boolean;
}) {
  const titleId = useId();
  const [name, setName] = useState('');
  const trimmedName = name.trim();
  const previewSeed = trimmedName
    ? createPlayerAvatarSeed(trimmedName)
    : 'player:anonymous-preview';

  return (
    <Dialog
      aria-labelledby={titleId}
      data-test="player_onboarding__dialog"
      fullWidth
      maxWidth="xs"
      open={open}
    >
      <DialogTitle
        data-test="player_onboarding__title"
        id={titleId}
        sx={{ fontWeight: 950, pb: 1 }}
      >
        {t(interfaceLanguage, 'playerOnboardingTitle')}
      </DialogTitle>
      <DialogContent data-test="player_onboarding__content">
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
            <PlayerPixelAvatar
              ariaLabel={trimmedName || t(interfaceLanguage, 'playerAnonymousName')}
              dataTest="player_onboarding__avatar_preview"
              seed={previewSeed}
              size={54}
            />
            <Typography
              data-test="player_onboarding__body"
              sx={{ color: 'text.secondary', lineHeight: 1.35 }}
            >
              {t(interfaceLanguage, 'playerOnboardingBody')}
            </Typography>
          </Stack>
          <TextField
            autoFocus
            data-test="player_onboarding__name_input"
            fullWidth
            label={t(interfaceLanguage, 'playerNameLabel')}
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && trimmedName) {
                onSave(trimmedName);
              }
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions
        data-test="player_onboarding__actions"
        sx={{ justifyContent: 'space-between', px: 3, pb: 2.5 }}
      >
        <Button
          data-test="player_onboarding__anonymous_button"
          variant="outlined"
          onClick={onAnonymous}
          sx={{
            borderColor: 'rgba(32, 48, 21, 0.24)',
            color: '#516143',
            fontWeight: 850,
            textTransform: 'none',
          }}
        >
          {t(interfaceLanguage, 'continueAnonymously')}
        </Button>
        <Button
          data-test="player_onboarding__save_button"
          disabled={!trimmedName}
          variant="contained"
          onClick={() => onSave(trimmedName)}
          sx={{
            background:
              'linear-gradient(135deg, #f9f871 0%, #9be667 46%, #61d4ff 100%)',
            border: '1px solid rgba(32, 48, 21, 0.18)',
            boxShadow: '0 10px 20px rgba(32, 48, 21, 0.18)',
            color: '#203015',
            fontWeight: 950,
            textTransform: 'none',
            '&:hover': {
              background:
                'linear-gradient(135deg, #fff176 0%, #a8ec72 48%, #7ddcff 100%)',
            },
          }}
        >
          {t(interfaceLanguage, 'savePlayerName')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const visibleTabSections: AppShellSection[] = [
  'game',
  'chat',
  'cards',
  'statistics',
  'help',
];
