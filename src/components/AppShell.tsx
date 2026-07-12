import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
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
              sx={{ minWidth: '0 !important' }}
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
  name,
}: {
  avatarSeed: string;
  name: string;
}) {
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
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          {name}
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
          flexShrink: 0,
          justifyContent: 'center',
          maxWidth: 230,
          minHeight: 36,
          overflow: 'hidden',
          position: 'relative',
          py: 0,
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
  'cards',
  'statistics',
  'help',
];
