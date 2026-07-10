import { useId, useState } from 'react';
import type { ReactNode } from 'react';
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
  | 'agents'
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
  const tabValue = visibleTabSections.includes(activeSection)
    ? activeSection
    : false;

  return (
    <Box
      data-test="app_shell__root"
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
          data-test="app_shell__toolbar"
          sx={{
            alignItems: { xs: 'flex-start', md: 'center' },
            columnGap: { xs: 1.25, md: 2 },
            rowGap: { xs: 1.25, md: 0 },
            flexWrap: { xs: 'wrap', md: 'nowrap' },
            minHeight: { xs: 'auto', md: 70 },
            py: { xs: 1.25, md: 0 },
          }}
        >
          <Box
            data-test="app_shell__logo_slot"
            sx={{
              display: 'flex',
              flexBasis: { xs: '100%', md: 'auto' },
              justifyContent: 'flex-start',
              minWidth: 0,
            }}
          >
            <AppLogo
              interfaceLanguage={interfaceLanguage}
              onClick={onLogoClick}
            />
          </Box>

          <Tabs
            data-test="app_shell__main_tabs"
            value={tabValue}
            onChange={(_, value: AppShellSection) => onNavigate?.(value)}
            aria-label="Main sections"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              alignSelf: { xs: 'stretch', md: 'auto' },
              minHeight: 44,
              maxWidth: { xs: '100%', md: 520 },
              '& .MuiTab-root': {
                color: 'inherit',
                minHeight: 44,
                px: { xs: 1.25, sm: 2 },
                textTransform: 'none',
                fontWeight: 800,
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
            />
            <Tab
              data-test="app_shell__tab__cards"
              value="cards"
              label={t(interfaceLanguage, 'cards')}
            />
            <Tab
              data-test="app_shell__tab__statistics"
              value="statistics"
              label={t(interfaceLanguage, 'statistics')}
            />
            <Tab
              data-test="app_shell__tab__agents"
              value="agents"
              label={t(interfaceLanguage, 'agentsSection')}
            />
          </Tabs>

          <Box
            data-test="app_shell__player_greeting_slot"
            sx={{
              alignItems: 'center',
              alignSelf: { xs: 'stretch', md: 'center' },
              display: 'flex',
              flexGrow: 1,
              justifyContent: 'center',
              minWidth: { xs: 0, md: 260 },
            }}
          >
            {playerProfile && (
              <PlayerGreeting
                avatarSeed={playerProfile.avatarSeed}
                interfaceLanguage={interfaceLanguage}
                name={
                  playerProfile.isAnonymous
                    ? t(interfaceLanguage, 'playerAnonymousName')
                    : (playerProfile.displayName ?? t(interfaceLanguage, 'playerAnonymousName'))
                }
              />
            )}
          </Box>
          <LanguageSelectors />
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
  interfaceLanguage,
  name,
}: {
  avatarSeed: string;
  interfaceLanguage: RootState['app']['interfaceLanguage'];
  name: string;
}) {
  return (
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
        flexShrink: 0,
        justifyContent: 'center',
        maxWidth: '100%',
        minHeight: 36,
        position: 'relative',
        px: 1,
        py: 0,
        width: 250,
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
          px: 5,
          textAlign: 'center',
          textShadow: '0 1px 0 rgba(255,255,255,0.74)',
          width: '100%',
        }}
      >
        {t(interfaceLanguage, 'playerGreetingPrefix')}, {name}
      </Typography>
    </Stack>
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
  'agents',
];
