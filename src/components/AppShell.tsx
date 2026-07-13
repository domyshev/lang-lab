import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import MilitaryTechOutlinedIcon from '@mui/icons-material/MilitaryTechOutlined';
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
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
  IconButton,
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
  getAssistantTooltip,
  getAssistantProfile,
  getVisibleAssistantCharacters,
  resolveAssistantId,
} from '../domain/assistants';
import { t } from '../domain/i18n';
import {
  WorldId,
  getDefaultAssistantIdForWorld,
  getWorldAccent,
  resolveWorldId,
  worldIds,
} from '../domain/worlds';
import {
  setAssistantId,
  setInterfaceLanguage,
  setPlayerProfile,
  setTargetLanguage,
  setWorldId,
} from '../store/appSlice';
import { AppDispatch, RootState } from '../store/store';
import { AppLogo } from './AppLogo';
import { AssistantStickerIcon } from './assistantAssets';
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
  const worldId = useSelector((state: RootState) =>
    resolveWorldId(state.app.worldId),
  );
  const completedGameCount = useSelector(
    (state: RootState & { attempts?: RootState['attempts'] }) =>
      state.attempts?.attempts.length ?? 0,
  );
  const dispatch = useDispatch<AppDispatch>();
  const scrollRootRef = useRef<HTMLDivElement>(null);
  const worldAccent = getWorldAccent(worldId);
  const appBarWorldSx = getAppBarWorldSx(worldId);
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
          ...appBarWorldSx,
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
              worldId={worldId}
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
                color: worldAccent.dark,
              },
              '& .MuiTabs-indicator': {
                bgcolor: worldAccent.dark,
                height: 3,
              },
            }}
          >
            <Tab
              data-test="app_shell__tab__game"
              value="game"
              label={t(interfaceLanguage, 'gamesTab')}
              onClick={() => onNavigate?.('game')}
              sx={{
                background:
                  'linear-gradient(180deg, #fff6a7 0%, #ffd447 47%, #f28b18 100%)',
                border: '1px solid rgba(116, 63, 8, 0.28)',
                borderRadius: '999px',
                boxShadow:
                  'inset 0 2px 0 rgba(255,255,255,0.88), inset 0 -4px 0 rgba(121, 68, 8, 0.18), 0 5px 0 rgba(127, 70, 8, 0.28), 0 10px 18px rgba(178, 83, 12, 0.20)',
                color: '#203015',
                fontWeight: '950 !important',
                minHeight: '34px !important',
                minWidth: '0 !important',
                px: { xs: 1.25, sm: 2.25 },
                textShadow: '0 1px 0 rgba(255,255,255,0.62)',
                transition:
                  'transform 150ms ease, box-shadow 150ms ease, filter 150ms ease',
                '&:hover': {
                  filter: 'saturate(1.08) brightness(1.03)',
                  transform: 'translateY(-1px)',
                },
                '&.Mui-selected': {
                  background:
                    'linear-gradient(180deg, #fff16d 0%, #ffc31f 43%, #e85f00 100%)',
                  boxShadow:
                    'inset 0 2px 0 rgba(255,255,255,0.90), inset 0 -4px 0 rgba(121, 68, 8, 0.22), 0 5px 0 rgba(127, 70, 8, 0.34), 0 12px 22px rgba(198, 78, 0, 0.26), 0 0 0 4px rgba(255, 221, 76, 0.28)',
                  color: '#203015',
                },
              }}
            />
            <Tab
              data-test="app_shell__tab__chat"
              value="chat"
              icon={<FootballAiChatIcon accent={worldAccent} />}
              iconPosition="start"
              label={t(interfaceLanguage, 'aiChatTitle')}
              sx={{
                color: worldAccent.dark,
                minWidth: '0 !important',
                '&.Mui-selected': { color: worldAccent.dark },
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
                assistantId={assistantId}
                avatarCountry={getPlayerSupporterCountry(worldId, assistantId)}
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
                      avatarSeed: createPlayerAvatarSeed(
                        trimmedName,
                        getPlayerSupporterCountry(worldId, assistantId),
                      ),
                      displayName: trimmedName || undefined,
                      isAnonymous: !trimmedName,
                    }),
                  );
                }}
                onAssistantChange={(nextAssistantId) => {
                  dispatch(setAssistantId(nextAssistantId));
                  const name =
                    playerProfile.isAnonymous
                      ? ''
                      : (playerProfile.displayName ?? '');
                  dispatch(
                    setPlayerProfile({
                      avatarSeed: createPlayerAvatarSeed(
                        name,
                        getPlayerSupporterCountry(worldId, nextAssistantId),
                      ),
                      displayName: name || undefined,
                      isAnonymous: !name,
                    }),
                  );
                }}
                worldId={worldId}
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
        worldId={worldId}
        onComplete={({
          assistantId,
          interfaceLanguage,
          name,
          targetLanguage,
          worldId,
        }) => {
          const trimmedName = name.trim();
          dispatch(setWorldId(worldId));
          dispatch(setAssistantId(assistantId));
          dispatch(setInterfaceLanguage(interfaceLanguage));
          dispatch(setTargetLanguage(targetLanguage));
          dispatch(
            setPlayerProfile({
              avatarSeed: createPlayerAvatarSeed(
                trimmedName,
                getPlayerSupporterCountry(worldId, assistantId),
              ),
              displayName: trimmedName || undefined,
              isAnonymous: !trimmedName,
            }),
          );
        }}
      />
    </Box>
  );
}

function FootballAiChatIcon({ accent }: { accent: ReturnType<typeof getWorldAccent> }) {
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
        stroke={accent.dark}
        strokeWidth="2"
      />
      <path
        d="M20 8v24M8 20h24M12 12l16 16M28 12 12 28"
        stroke={accent.main}
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
      <circle cx="12" cy="31" r="2" fill={accent.main} />
    </Box>
  );
}

function PlayerGreeting({
  assistantId,
  avatarCountry,
  avatarSeed,
  completedGameCount,
  interfaceLanguage,
  name,
  onAssistantChange,
  onNameChange,
  worldId,
}: {
  assistantId: AssistantId;
  avatarCountry: SupporterCountry;
  avatarSeed: string;
  completedGameCount: number;
  interfaceLanguage: RootState['app']['interfaceLanguage'];
  name: string;
  onAssistantChange: (assistantId: AssistantId) => void;
  onNameChange: (name: string) => void;
  worldId: WorldId;
}) {
  const playerLevel = getPlayerLevel(completedGameCount, interfaceLanguage);
  const resolvedAssistantId = resolveAssistantId(assistantId, worldId);
  const visibleAssistants = getVisibleAssistantCharacters(worldId);
  const [draftName, setDraftName] = useState(name);
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    setDraftName(name);
    setIsEditingName(false);
  }, [name]);

  const saveDraftName = () => {
    onNameChange(draftName);
    setIsEditingName(false);
  };

  const assistantSelect = (
    <Box
      data-test="player_greeting__assistant_slot"
      sx={{
        alignItems: 'center',
        bgcolor: (theme) =>
          theme.palette.mode === 'dark'
            ? 'rgba(246, 240, 255, 0.08)'
            : 'rgba(245, 249, 235, 0.88)',
        border: '1px solid rgba(118, 146, 79, 0.22)',
        borderRadius: 999,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.64)',
        display: 'flex',
        flexShrink: 0,
        height: 36,
        justifyContent: 'center',
        marginLeft: '10px',
        width: 56,
      }}
    >
      <Select
        aria-label={t(interfaceLanguage, 'assistant')}
        data-test="player_greeting__assistant_select"
        value={resolvedAssistantId}
        variant="standard"
        disableUnderline
        onChange={(event: SelectChangeEvent<AssistantId>) =>
          onAssistantChange(event.target.value as AssistantId)
        }
        renderValue={(value) => (
          <AssistantStickerIcon
            ariaLabel={getAssistantTooltip(value, interfaceLanguage, worldId)}
            assistantId={value}
            dataTest={`player_greeting__assistant_selected_sticker__${value}`}
            size={28}
            worldId={worldId}
          />
        )}
        sx={{
          height: 34,
          minWidth: 48,
          '& .MuiSelect-select': {
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'center',
            pl: 0.25,
            pr: '17px !important',
            py: 0,
          },
          '& .MuiSelect-icon': {
            fontSize: 18,
            right: 0,
          },
        }}
      >
        {visibleAssistants.map((assistant) => {
          const tooltip = getAssistantTooltip(
            assistant.id,
            interfaceLanguage,
            worldId,
          );
          return (
            <MenuItem
              aria-label={tooltip}
              data-test={`player_greeting__assistant_option__${assistant.id}`}
              key={assistant.id}
              value={assistant.id}
              sx={{ justifyContent: 'center' }}
            >
              <Tooltip arrow title={tooltip}>
                <Box
                  component="span"
                  data-test={`player_greeting__assistant_option_icon__${assistant.id}`}
                  sx={{ display: 'inline-flex' }}
                >
                  <AssistantStickerIcon
                    ariaLabel={tooltip}
                    assistantId={assistant.id}
                    dataTest={`player_greeting__assistant_option_sticker__${assistant.id}`}
                    size={36}
                    worldId={worldId}
                  />
                </Box>
              </Tooltip>
            </MenuItem>
          );
        })}
      </Select>
    </Box>
  );

  return (
    <Stack
      direction="row"
      sx={{
        alignItems: 'center',
        flexShrink: 0,
        justifyContent: 'center',
        minWidth: 0,
      }}
    >
      <Tooltip
        arrow
        disableInteractive={false}
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
            <Stack
              direction="row"
              sx={{
                alignItems: 'center',
                gap: 0.75,
                justifyContent: 'space-between',
                minWidth: 0,
              }}
            >
              {isEditingName ? (
                <TextField
                  autoFocus
                  data-test="player_greeting__edit_name_input"
                  hiddenLabel
                  inputProps={{
                    'aria-label': t(interfaceLanguage, 'editPlayerName'),
                  }}
                  size="small"
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      saveDraftName();
                    }
                  }}
                  sx={{
                    minWidth: 0,
                    width: 170,
                    '& .MuiInputBase-root': {
                      bgcolor: (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(245, 249, 235, 0.92)',
                      borderRadius: 1.5,
                      fontSize: 14,
                      fontWeight: 850,
                      height: 32,
                    },
                    '& .MuiInputBase-input': {
                      py: 0.3,
                    },
                  }}
                />
              ) : (
                <Typography
                  data-test="player_greeting__tooltip_name"
                  sx={{
                    color: (theme) =>
                      theme.palette.mode === 'dark' ? '#f6f0ff' : '#203015',
                    fontSize: 14,
                    fontWeight: 900,
                    lineHeight: 1.2,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {name}
                </Typography>
              )}
              <IconButton
                aria-label={t(
                  interfaceLanguage,
                  isEditingName ? 'savePlayerNameChange' : 'editPlayerName',
                )}
                data-test={
                  isEditingName
                    ? 'player_greeting__save_name_button'
                    : 'player_greeting__edit_name_button'
                }
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  if (isEditingName) {
                    saveDraftName();
                    return;
                  }
                  setIsEditingName(true);
                }}
                onMouseDown={(event) => event.preventDefault()}
                sx={{
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(246, 240, 255, 0.10)'
                      : 'rgba(24, 119, 201, 0.10)',
                  border: '1px solid rgba(24, 119, 201, 0.22)',
                  color: (theme) =>
                    theme.palette.mode === 'dark' ? '#d8cdf8' : '#1877c9',
                  flexShrink: 0,
                  height: 28,
                  width: 28,
                  '&:hover': {
                    bgcolor: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(246, 240, 255, 0.18)'
                        : 'rgba(24, 119, 201, 0.18)',
                  },
                }}
              >
                {isEditingName ? (
                  <SaveOutlinedIcon fontSize="inherit" />
                ) : (
                  <EditOutlinedIcon fontSize="inherit" />
                )}
              </IconButton>
            </Stack>
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
            flexShrink: 1,
            justifyContent: 'center',
            maxWidth: 345,
            minHeight: 36,
            minWidth: 0,
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
              pr: 2,
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
      {assistantSelect}
    </Stack>
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
  worldId,
}: {
  assistantId: AssistantId;
  interfaceLanguage: RootState['app']['interfaceLanguage'];
  onComplete: (value: {
    assistantId: AssistantId;
    interfaceLanguage: SupportedLanguage;
    name: string;
    targetLanguage: SupportedLanguage;
    worldId: WorldId;
  }) => void;
  open: boolean;
  targetLanguage: SupportedLanguage;
  worldId: WorldId;
}) {
  const titleId = useId();
  const interfaceLabelId = useId();
  const targetLabelId = useId();
  const [name, setName] = useState('');
  const [selectedAssistantId, setSelectedAssistantId] =
    useState<AssistantId | ''>('');
  const [selectedWorldId, setSelectedWorldId] = useState<WorldId>('forest');
  const [selectedInterfaceLanguage, setSelectedInterfaceLanguage] = useState<
    SupportedLanguage | ''
  >('');
  const [selectedTargetLanguage, setSelectedTargetLanguage] = useState<
    SupportedLanguage | ''
  >('');
  const trimmedName = name.trim();
  const resolvedSelectedWorldId = selectedWorldId || worldId;
  const copyLanguage = selectedInterfaceLanguage || 'en';
  const visibleAssistants = getVisibleAssistantCharacters(resolvedSelectedWorldId);
  const isReady = Boolean(
    selectedWorldId &&
      selectedAssistantId &&
      selectedInterfaceLanguage &&
      selectedTargetLanguage,
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
      worldId: selectedWorldId || worldId,
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
          <Stack
            data-test="player_onboarding__world_choice"
            sx={{
              gap: '8px',
              overflow: 'visible',
            }}
          >
            <Button
              aria-pressed={selectedWorldId === 'forest'}
              data-test="player_onboarding__world_button__forest"
              fullWidth
              onClick={() => {
                setSelectedWorldId('forest');
                setSelectedAssistantId('');
              }}
              sx={getWorldChoiceButtonSx('forest', selectedWorldId === 'forest')}
            >
              <PlayerPixelAvatar
                country="forest"
                dataTest="player_onboarding__world_icon__forest"
                seed="onboarding-world-forest"
                size={32}
              />
              <Typography
                component="span"
                sx={{ fontSize: 17, fontWeight: 950, lineHeight: 1.1 }}
              >
                {t(copyLanguage, 'forestWorldChoice')}
              </Typography>
            </Button>
            <Button
              aria-pressed={selectedWorldId === 'football'}
              data-test="player_onboarding__world_button__football"
              fullWidth
              onClick={() => {
                setSelectedWorldId('football');
                setSelectedAssistantId('');
              }}
              sx={getWorldChoiceButtonSx(
                'football',
                selectedWorldId === 'football',
              )}
            >
              <FootballWorldIcon
                dataTest="player_onboarding__world_icon__football"
                size={32}
              />
              <Typography
                component="span"
                sx={{ fontSize: 17, fontWeight: 950, lineHeight: 1.1 }}
              >
                {t(copyLanguage, 'footballWorldChoice')}
              </Typography>
            </Button>
          </Stack>
          <Stack
            data-test="player_onboarding__assistant_figures"
            direction="row"
            spacing={1}
            sx={{ flexWrap: 'wrap' }}
            useFlexGap
          >
            {visibleAssistants.map((assistant) => {
              const tooltip = getAssistantTooltip(
                assistant.id,
                copyLanguage,
                resolvedSelectedWorldId,
              );
              const isSelected = selectedAssistantId === assistant.id;

              return (
                <Tooltip arrow key={assistant.id} title={tooltip}>
                  <Button
                    aria-label={assistant.name[copyLanguage]}
                    aria-pressed={isSelected}
                    data-test={`player_onboarding__assistant_figure__${assistant.id}`}
                    onClick={() => setSelectedAssistantId(assistant.id)}
                    sx={{
                      border: '2px solid',
                      borderColor: isSelected ? '#123c69' : 'rgba(32, 48, 21, 0.14)',
                      borderRadius: 3,
                      minWidth: 64,
                      p: 0.75,
                      bgcolor: isSelected
                        ? 'rgba(255, 246, 196, 0.92)'
                        : 'rgba(255,255,255,0.72)',
                    }}
                  >
                    <AssistantStickerIcon
                      ariaLabel={tooltip}
                      assistantId={assistant.id}
                      dataTest={`player_onboarding__assistant_sticker__${assistant.id}`}
                      size={48}
                      worldId={resolvedSelectedWorldId}
                    />
                  </Button>
                </Tooltip>
              );
            })}
          </Stack>
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
              {t(copyLanguage, 'targetLearningLanguage')}
            </InputLabel>
            <Select
              data-test="player_onboarding__target_language_select"
              label={t(copyLanguage, 'targetLearningLanguage')}
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
        sx={{ justifyContent: 'flex-end', px: 3, pb: 2.5 }}
      >
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

function FootballWorldIcon({
  dataTest,
  size,
}: {
  dataTest: string;
  size: number;
}) {
  return (
    <Box
      aria-hidden="true"
      component="svg"
      data-test={dataTest}
      focusable="false"
      viewBox="0 0 64 64"
      sx={{
        display: 'block',
        filter:
          'drop-shadow(0 4px 0 rgba(60, 24, 14, 0.2)) drop-shadow(0 8px 12px rgba(32, 48, 21, 0.16))',
        height: size,
        width: size,
      }}
    >
      <defs>
        <radialGradient id="football-world-ball-glow" cx="32%" cy="24%" r="72%">
          <stop offset="0" stopColor="#fffdf4" />
          <stop offset="0.48" stopColor="#f8f1d7" />
          <stop offset="1" stopColor="#e4d3ac" />
        </radialGradient>
        <linearGradient id="football-world-ball-shine" x1="12" x2="48" y1="8" y2="54">
          <stop offset="0" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="0.58" stopColor="rgba(255,255,255,0.16)" />
          <stop offset="1" stopColor="rgba(51,23,16,0.22)" />
        </linearGradient>
      </defs>
      <circle
        cx="32"
        cy="32"
        r="27"
        fill="url(#football-world-ball-glow)"
        stroke="#6f2f1c"
        strokeWidth="3"
      />
      <path
        d="M32 17 43 25 39 39H25L21 25Z"
        fill="#203015"
        opacity="0.9"
      />
      <path
        d="M32 17V7M43 25l10-4M39 39l7 9M25 39l-7 9M21 25l-10-4"
        fill="none"
        stroke="#203015"
        strokeLinecap="round"
        strokeWidth="3"
      />
      <path
        d="M13 36c9 8 27 10 39 0M19 13c8 9 20 12 31 8"
        fill="none"
        stroke="#c60b1e"
        strokeLinecap="round"
        strokeWidth="3"
        opacity="0.75"
      />
      <path
        d="M18 16c8-9 24-12 36 2"
        fill="none"
        stroke="#ffc400"
        strokeLinecap="round"
        strokeWidth="4"
        opacity="0.86"
      />
      <circle cx="32" cy="32" r="27" fill="url(#football-world-ball-shine)" />
    </Box>
  );
}

function getWorldChoiceButtonSx(world: WorldId, isSelected: boolean) {
  const forestSx = {
    background:
      'linear-gradient(135deg, #f4ffd8 0%, #b8ec9d 46%, #7fd4b0 100%)',
    color: '#1f3c1c',
    glow: 'rgba(95, 155, 62, 0.36)',
    line: '#4f8e5b',
    lineSoft: '#7bae63',
  };
  const footballSx = {
    background:
      'linear-gradient(135deg, #fff1a8 0%, #ffc400 36%, #c60b1e 100%)',
    color: '#331710',
    glow: 'rgba(198, 11, 30, 0.35)',
    line: '#8b1b16',
    lineSoft: '#b24b2a',
  };
  const palette = world === 'forest' ? forestSx : footballSx;

  return {
    background: palette.background,
    color: palette.color,
    border: '2px solid',
    borderColor: isSelected ? palette.line : palette.lineSoft,
    borderRadius: 3,
    boxShadow: isSelected
      ? `0 0 0 3px rgba(255, 253, 244, 0.9), 0 0 20px ${palette.glow}, 0 14px 26px rgba(32, 48, 21, 0.22), inset 0 -8px 16px rgba(32, 48, 21, 0.08)`
      : `0 0 14px ${palette.glow}, 0 7px 15px rgba(32, 48, 21, 0.12), inset 0 1px 0 rgba(255,255,255,0.78)`,
    fontSize: 17,
    fontWeight: 950,
    gap: 1.15,
    justifyContent: 'flex-start',
    minHeight: 58,
    px: 2,
    textTransform: 'none',
    transition:
      'box-shadow 160ms ease, filter 160ms ease, opacity 160ms ease',
    '&:hover': {
      filter: 'saturate(1.12) brightness(1.02)',
      boxShadow: isSelected
        ? `0 0 0 3px rgba(255, 253, 244, 0.96), 0 0 24px ${palette.glow}, 0 16px 30px rgba(32, 48, 21, 0.25), inset 0 -8px 16px rgba(32, 48, 21, 0.08)`
        : `0 0 18px ${palette.glow}, 0 11px 22px rgba(32, 48, 21, 0.17), inset 0 1px 0 rgba(255,255,255,0.84)`,
    },
  };
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

function getPlayerSupporterCountry(
  worldId: WorldId,
  assistantId: AssistantId | string | undefined,
): SupporterCountry {
  return worldId === 'forest'
    ? 'forest'
    : getAssistantSupporterCountry(assistantId);
}

function getAppBarWorldSx(worldId: WorldId) {
  if (worldId === 'forest') {
    return {
      background:
        'linear-gradient(90deg, #f4fbeb 0%, #d8f1b7 48%, #f9ffe9 100%)',
      bgcolor: '#d8f1b7',
      borderBottom: '2px solid rgba(117, 168, 67, 0.30)',
      boxShadow: '0 8px 22px rgba(63, 91, 38, 0.08)',
    };
  }

  return {
    background:
      'linear-gradient(90deg, #fff0a8 0%, #ffd24d 46%, #fff3bd 100%)',
    bgcolor: '#ffd24d',
    borderBottom: '2px solid rgba(198, 11, 30, 0.28)',
    boxShadow: '0 8px 22px rgba(124, 21, 24, 0.08)',
  };
}

const visibleTabSections: AppShellSection[] = [
  'game',
  'chat',
  'cards',
  'statistics',
  'help',
];
