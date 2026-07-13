import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import MilitaryTechOutlinedIcon from '@mui/icons-material/MilitaryTechOutlined';
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
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
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Toolbar,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { useDispatch, useSelector } from 'react-redux';
import {
  AssistantId,
  visibleAssistantCharacters,
} from '../domain/assistants';
import { stadiumAccent } from '../domain/footballTheme';
import { t } from '../domain/i18n';
import {
  setAssistantId,
  setInterfaceLanguage,
  setPlayerProfile,
  setTargetLanguage,
} from '../store/appSlice';
import { AppDispatch, RootState } from '../store/store';
import { AppLogo } from './AppLogo';
import { LanguageSelectors } from './LanguageSelectors';
import {
  createPlayerAvatarSeed,
  PlayerPixelAvatar,
  SupporterCountry,
} from './PlayerPixelAvatar';
import {
  languageFlags,
  languageLabels,
  SupportedLanguage,
  supportedLanguages,
} from '../domain/languages';

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
  const assistantId = useSelector((state: RootState) => state.app.assistantId);
  const targetLanguage = useSelector(
    (state: RootState) => state.app.targetLanguage,
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
          background:
            'linear-gradient(90deg, #fff0a8 0%, #ffd24d 46%, #fff3bd 100%)',
          bgcolor: '#ffd24d',
          borderBottom: '2px solid rgba(198, 11, 30, 0.28)',
          boxShadow: '0 8px 22px rgba(124, 21, 24, 0.08)',
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
                gap: '15px',
              },
              '& .Mui-selected': {
                color: stadiumAccent.dark,
              },
              '& .MuiTabs-indicator': {
                bgcolor: stadiumAccent.dark,
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
              icon={<FootballAiChatIcon />}
              iconPosition="start"
              label={t(interfaceLanguage, 'aiChatTitle')}
              sx={{
                color: stadiumAccent.dark,
                minWidth: '0 !important',
                '&.Mui-selected': { color: stadiumAccent.dark },
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
                avatarCountry={getAssistantSupporterCountry(assistantId)}
                avatarSeed={playerProfile.avatarSeed}
                completedGameCount={completedGameCount}
                interfaceLanguage={interfaceLanguage}
                name={
                  playerProfile.isAnonymous
                    ? t(interfaceLanguage, 'playerAnonymousName')
                    : (playerProfile.displayName ?? t(interfaceLanguage, 'playerAnonymousName'))
                }
                onNameChange={(name) => {
                  const trimmedName = name.trim();
                  dispatch(
                    setPlayerProfile({
                      avatarSeed: createPlayerAvatarSeed(trimmedName),
                      displayName: trimmedName || undefined,
                      isAnonymous: !trimmedName,
                    }),
                  );
                }}
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
        assistantId={assistantId}
        interfaceLanguage={interfaceLanguage}
        open={!playerProfile}
        targetLanguage={targetLanguage}
        onComplete={({ assistantId, interfaceLanguage, name, targetLanguage }) => {
          const trimmedName = name.trim();
          dispatch(setAssistantId(assistantId));
          dispatch(setInterfaceLanguage(interfaceLanguage));
          dispatch(setTargetLanguage(targetLanguage));
          dispatch(
            setPlayerProfile({
              avatarSeed: createPlayerAvatarSeed(trimmedName),
              displayName: trimmedName || undefined,
              isAnonymous: !trimmedName,
            }),
          );
        }}
      />
    </Box>
  );
}

function FootballAiChatIcon() {
  return (
    <Box
      component="svg"
      aria-hidden="true"
      data-test="app_shell__tab_icon__chat_football_ai_ball"
      viewBox="0 0 40 40"
      sx={{ height: 24, width: 24 }}
    >
      <circle
        cx="20"
        cy="20"
        r="15"
        fill="#fffdf4"
        stroke={stadiumAccent.dark}
        strokeWidth="2"
      />
      <path
        d="M20 8v24M8 20h24M12 12l16 16M28 12 12 28"
        stroke={stadiumAccent.main}
        strokeWidth="1.4"
        opacity="0.62"
      />
      <path
        d="M15 16h10l3 4-3 4H15l-3-4Z"
        fill="#fff3bd"
        stroke="#c60b1e"
        strokeWidth="1.4"
      />
      <circle cx="30" cy="9" r="3" fill="#ffc400" />
      <path
        d="M30 2v4M30 12v4M23 9h4M33 9h4"
        stroke="#c60b1e"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="31" r="2" fill={stadiumAccent.main} />
    </Box>
  );
}

function PlayerGreeting({
  avatarCountry,
  avatarSeed,
  completedGameCount,
  interfaceLanguage,
  name,
  onNameChange,
}: {
  avatarCountry: SupporterCountry;
  avatarSeed: string;
  completedGameCount: number;
  interfaceLanguage: RootState['app']['interfaceLanguage'];
  name: string;
  onNameChange: (name: string) => void;
}) {
  const playerLevel = getPlayerLevel(completedGameCount, interfaceLanguage);
  const [draftName, setDraftName] = useState(name);

  useEffect(() => {
    setDraftName(name);
  }, [name]);

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
            <Stack
              data-test="player_greeting__edit_name_form"
              spacing={0.75}
              sx={{
                bgcolor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(245, 249, 235, 0.86)',
                border: '1px solid rgba(118, 146, 79, 0.24)',
                borderRadius: 2,
                p: 1,
              }}
            >
              <TextField
                data-test="player_greeting__edit_name_input"
                label={t(interfaceLanguage, 'editPlayerName')}
                size="small"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    onNameChange(draftName);
                  }
                }}
              />
              <Button
                data-test="player_greeting__save_name_button"
                size="small"
                variant="outlined"
                onClick={() => onNameChange(draftName)}
                sx={{
                  alignSelf: 'flex-end',
                  borderColor: 'rgba(198, 11, 30, 0.34)',
                  color: '#7c1518',
                  fontWeight: 900,
                  textTransform: 'none',
                }}
              >
                {t(interfaceLanguage, 'savePlayerNameChange')}
              </Button>
            </Stack>
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
            country={avatarCountry}
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
  uk: [
    {
      title: 'Новачок',
      description:
        'Ігровий рівень починається тут: зіграй ще кілька ігор, і лабораторія побачить твій ритм навчання.',
    },
    {
      title: 'Просунутий новачок',
      description:
        'Ігровий рівень уже набирає хід: ти знаєш правила і будуєш стабільний тренувальний маршрут.',
    },
    {
      title: 'Впевнений гравець',
      description:
        'Ігровий рівень показує сталу практику: бібліотека стає інструментом, яким ти керуєш.',
    },
    {
      title: 'Збирач карток',
      description:
        'Ігровий рівень каже, що словниковий двигун прогрівся: набори, повтори й результати починають працювати разом.',
    },
    {
      title: 'Стратег тренування',
      description:
        'Ігровий рівень уже тактичний: історії достатньо, щоб усвідомлено вибирати слабкі картки.',
    },
    {
      title: 'Майстер мов',
      description:
        'Ігровий рівень серйозний: лабораторія накопичила достатньо ігор, щоб бачити малюнок прогресу.',
    },
    {
      title: 'Легенда лабораторії',
      description:
        'Ігровий рівень легендарний: це вже не розминка, а особиста мовна машина.',
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
  if (interfaceLanguage === 'uk') {
    return `${completedGameCount} пройдено ігор`;
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
  assistantId,
  interfaceLanguage,
  onComplete,
  open,
  targetLanguage,
}: {
  assistantId: AssistantId;
  interfaceLanguage: RootState['app']['interfaceLanguage'];
  onComplete: (value: {
    assistantId: AssistantId;
    interfaceLanguage: SupportedLanguage;
    name: string;
    targetLanguage: SupportedLanguage;
  }) => void;
  open: boolean;
  targetLanguage: SupportedLanguage;
}) {
  const titleId = useId();
  const assistantLabelId = useId();
  const interfaceLabelId = useId();
  const targetLabelId = useId();
  const [name, setName] = useState('');
  const [selectedAssistantId, setSelectedAssistantId] =
    useState<AssistantId | ''>('');
  const [selectedInterfaceLanguage, setSelectedInterfaceLanguage] = useState<
    SupportedLanguage | ''
  >('');
  const [selectedTargetLanguage, setSelectedTargetLanguage] = useState<
    SupportedLanguage | ''
  >('');
  const trimmedName = name.trim();
  const previewSeed = trimmedName
    ? createPlayerAvatarSeed(trimmedName)
    : 'player:anonymous-preview';
  const previewCountry = selectedAssistantId
    ? getAssistantSupporterCountry(selectedAssistantId)
    : 'spain';
  const copyLanguage = selectedInterfaceLanguage || interfaceLanguage;
  const isReady = Boolean(
    selectedAssistantId && selectedInterfaceLanguage && selectedTargetLanguage,
  );
  const complete = (nextName: string) => {
    if (!isReady) {
      return;
    }
    onComplete({
      assistantId: selectedAssistantId || assistantId,
      interfaceLanguage: selectedInterfaceLanguage || interfaceLanguage,
      name: nextName,
      targetLanguage: selectedTargetLanguage || targetLanguage,
    });
  };

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
        {t(copyLanguage, 'playerOnboardingTitle')}
      </DialogTitle>
      <DialogContent data-test="player_onboarding__content">
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
            <PlayerPixelAvatar
              ariaLabel={trimmedName || t(copyLanguage, 'playerAnonymousName')}
              country={previewCountry}
              dataTest="player_onboarding__avatar_preview"
              seed={previewSeed}
              size={54}
            />
            <Typography
              data-test="player_onboarding__body"
              sx={{ color: 'text.secondary', lineHeight: 1.35 }}
            >
              {t(copyLanguage, 'playerOnboardingBody')}
            </Typography>
          </Stack>
          <FormControl
            data-test="player_onboarding__assistant_control"
            fullWidth
          >
            <InputLabel id={assistantLabelId}>
              {t(copyLanguage, 'assistant')}
            </InputLabel>
            <Select
              data-test="player_onboarding__assistant_select"
              label={t(copyLanguage, 'assistant')}
              labelId={assistantLabelId}
              value={selectedAssistantId}
              onChange={(event: SelectChangeEvent<AssistantId | ''>) =>
                setSelectedAssistantId(event.target.value as AssistantId)
              }
            >
              {visibleAssistantCharacters.map((assistant) => (
                <MenuItem key={assistant.id} value={assistant.id}>
                  {assistant.name[copyLanguage]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl
            data-test="player_onboarding__interface_language_control"
            fullWidth
          >
            <InputLabel id={interfaceLabelId}>
              {t(copyLanguage, 'interfaceLanguage')}
            </InputLabel>
            <Select
              data-test="player_onboarding__interface_language_select"
              label={t(copyLanguage, 'interfaceLanguage')}
              labelId={interfaceLabelId}
              value={selectedInterfaceLanguage}
              onChange={(event: SelectChangeEvent<SupportedLanguage | ''>) =>
                setSelectedInterfaceLanguage(
                  event.target.value as SupportedLanguage,
                )
              }
            >
              {supportedLanguages.map((language) => (
                <MenuItem
                  aria-label={languageLabels[language]}
                  key={language}
                  value={language}
                >
                  {languageFlags[language]} {languageLabels[language]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl
            data-test="player_onboarding__target_language_control"
            fullWidth
          >
            <InputLabel id={targetLabelId}>
              {t(copyLanguage, 'targetLanguage')}
            </InputLabel>
            <Select
              data-test="player_onboarding__target_language_select"
              label={t(copyLanguage, 'targetLanguage')}
              labelId={targetLabelId}
              value={selectedTargetLanguage}
              onChange={(event: SelectChangeEvent<SupportedLanguage | ''>) =>
                setSelectedTargetLanguage(event.target.value as SupportedLanguage)
              }
            >
              {supportedLanguages.map((language) => (
                <MenuItem
                  aria-label={languageLabels[language]}
                  key={language}
                  value={language}
                >
                  {languageFlags[language]} {languageLabels[language]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            data-test="player_onboarding__name_input"
            fullWidth
            label={t(copyLanguage, 'playerNameLabel')}
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && trimmedName && isReady) {
                complete(trimmedName);
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
          disabled={!isReady}
          variant="outlined"
          onClick={() => complete('')}
          sx={{
            borderColor: 'rgba(32, 48, 21, 0.24)',
            color: '#516143',
            fontWeight: 850,
            textTransform: 'none',
          }}
        >
          {t(copyLanguage, 'continueAnonymously')}
        </Button>
        <Button
          data-test="player_onboarding__save_button"
          disabled={!trimmedName || !isReady}
          variant="contained"
          onClick={() => complete(trimmedName)}
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
          {t(copyLanguage, 'savePlayerName')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function getAssistantSupporterCountry(
  assistantId: AssistantId | string | undefined,
): SupporterCountry {
  switch (assistantId) {
    case 'greenPower':
      return 'portugal';
    case 'webRunner':
      return 'england';
    case 'capeChampion':
      return 'germany';
    case 'studyTroll':
    case 'trollMama':
    default:
      return 'spain';
  }
}

const visibleTabSections: AppShellSection[] = [
  'game',
  'chat',
  'cards',
  'statistics',
  'help',
];
