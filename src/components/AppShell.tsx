import type { ReactNode } from 'react';
import {
  AppBar,
  Box,
  Container,
  Tab,
  Tabs,
  Toolbar,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { t } from '../domain/i18n';
import { RootState } from '../store/store';
import { AppLogo } from './AppLogo';
import { LanguageSelectors } from './LanguageSelectors';

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
            data-test="app_shell__toolbar_spacer"
            sx={{ display: { xs: 'none', md: 'block' }, flexGrow: 1 }}
          />
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
    </Box>
  );
}

const visibleTabSections: AppShellSection[] = [
  'game',
  'cards',
  'statistics',
  'agents',
];
