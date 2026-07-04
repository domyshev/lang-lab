import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import ArchiveIcon from '@mui/icons-material/Archive';
import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { ALL_WORDS_THEME_ID } from '../domain/themes';
import { formatCardCount, formatTopicCount, t } from '../domain/i18n';
import { addTheme, archiveTheme, selectTheme } from '../store/themesSlice';
import { AppDispatch, RootState } from '../store/store';

export function ThemeListView() {
  const dispatch = useDispatch<AppDispatch>();
  const cards = useSelector((state: RootState) => state.cards.cards);
  const themes = useSelector((state: RootState) => state.themes.themes);
  const selectedThemeId = useSelector(
    (state: RootState) => state.themes.selectedThemeId,
  );
  const interfaceLanguage = useSelector(
    (state: RootState) => state.app.interfaceLanguage,
  );
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const visibleThemes = themes.filter((theme) => !theme.archivedAt);

  const createTheme = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    const now = new Date().toISOString();
    dispatch(
      addTheme({
        id: createThemeId(),
        name: trimmedName,
        cardIds: [],
        createdAt: now,
        updatedAt: now,
      }),
    );
    setName('');
    setIsCreating(false);
  }

  return (
    <Paper sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={2.5}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 800 }}>
              {t(interfaceLanguage, 'cards')}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              {formatTopicCount(interfaceLanguage, visibleThemes.length + 1)}
            </Typography>
          </Box>
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => setIsCreating((value) => !value)}
          >
            {t(interfaceLanguage, 'add')}
          </Button>
        </Stack>

        {isCreating && (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ width: '100%' }}
          >
            <TextField
              label={t(interfaceLanguage, 'newTheme')}
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  createTheme();
                }
              }}
              fullWidth
            />
            <Button
              variant="contained"
              onClick={createTheme}
              disabled={!name.trim()}
              sx={{ minWidth: 150 }}
            >
              {t(interfaceLanguage, 'create')}
            </Button>
          </Stack>
        )}

        <Stack spacing={1.25}>
          <ThemeTile
            name={t(interfaceLanguage, 'allWords')}
            cardCount={cards.length}
            interfaceLanguage={interfaceLanguage}
            selected={
              selectedThemeId === ALL_WORDS_THEME_ID || !selectedThemeId
            }
            onSelect={() => dispatch(selectTheme(ALL_WORDS_THEME_ID))}
          />

          {visibleThemes.map((theme) => (
            <ThemeTile
              key={theme.id}
              name={theme.name}
              cardCount={theme.cardIds.length}
              interfaceLanguage={interfaceLanguage}
              selected={theme.id === selectedThemeId}
              onArchive={() =>
                dispatch(
                  archiveTheme({
                    themeId: theme.id,
                    archivedAt: new Date().toISOString(),
                  }),
                )
              }
              onSelect={() => dispatch(selectTheme(theme.id))}
            />
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

function ThemeTile({
  cardCount,
  interfaceLanguage,
  name,
  onArchive,
  onSelect,
  selected,
}: {
  cardCount: number;
  interfaceLanguage: RootState['app']['interfaceLanguage'];
  name: string;
  onArchive?: () => void;
  onSelect: () => void;
  selected: boolean;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderColor: selected ? 'primary.main' : 'divider',
        overflow: 'hidden',
      }}
    >
      <Stack direction="row" alignItems="center">
        <Box
          role="button"
          tabIndex={0}
          onClick={onSelect}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onSelect();
            }
          }}
          sx={{
            cursor: 'pointer',
            flexGrow: 1,
            minWidth: 0,
            p: 1.5,
          }}
        >
          <Typography fontWeight={800} noWrap>
            {name}
          </Typography>
          <Chip
            label={formatCardCount(interfaceLanguage, cardCount)}
            size="small"
            variant="outlined"
            sx={{ mt: 1 }}
          />
        </Box>

        {onArchive && (
          <Tooltip title={t(interfaceLanguage, 'archive')}>
            <IconButton
              aria-label={`В архив: ${name}`}
              onClick={onArchive}
              sx={{ mx: 1 }}
            >
              <ArchiveIcon />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Paper>
  );
}

function createThemeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `theme-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
