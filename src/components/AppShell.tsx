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

export type AppShellSection = 'game' | 'cards' | 'statistics' | 'import';

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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: '#dcefb1',
          borderBottom: '1px solid rgba(32, 48, 21, 0.16)',
          color: '#203015',
        }}
      >
        <Toolbar
          sx={{
            alignItems: { xs: 'stretch', md: 'center' },
            gap: 2,
            minHeight: { xs: 120, md: 72 },
            py: { xs: 1.5, md: 0 },
            flexDirection: { xs: 'column', md: 'row' },
          }}
        >
          <AppLogo
            interfaceLanguage={interfaceLanguage}
            onClick={onLogoClick}
          />

          <Tabs
            value={activeSection}
            onChange={(_, value: AppShellSection) => onNavigate?.(value)}
            aria-label="Main sections"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
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
            <Tab value="game" label={t(interfaceLanguage, 'game')} />
            <Tab value="cards" label={t(interfaceLanguage, 'cards')} />
            <Tab
              value="statistics"
              label={t(interfaceLanguage, 'statistics')}
            />
            <Tab value="import" label={t(interfaceLanguage, 'importSection')} />
          </Tabs>

          <Box sx={{ flexGrow: 1 }} />
          <LanguageSelectors />
        </Toolbar>
      </AppBar>

      <Container component="main" maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
        {children}
      </Container>
    </Box>
  );
}
