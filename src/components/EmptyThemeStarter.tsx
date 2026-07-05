import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import { Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useDispatch } from 'react-redux';
import { addTheme } from '../store/themesSlice';
import { AppDispatch } from '../store/store';

export function EmptyThemeStarter() {
  const dispatch = useDispatch<AppDispatch>();
  const [name, setName] = useState('');

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
  };

  return (
    <Paper data-test="empty_theme_starter__panel" sx={{ p: { xs: 2, md: 3 } }}>
      <Stack
        data-test="empty_theme_starter__content"
        spacing={2}
        alignItems="flex-start"
      >
        <Stack data-test="empty_theme_starter__header" spacing={0.5}>
          <Typography
            data-test="empty_theme_starter__title"
            variant="h5"
            component="h2"
            sx={{ fontWeight: 800 }}
          >
            Create your first theme
          </Typography>
          <Typography
            color="text.secondary"
            data-test="empty_theme_starter__description"
          >
            Themes group imported cards into focused practice sets.
          </Typography>
        </Stack>

        <Stack
          data-test="empty_theme_starter__form"
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ width: '100%' }}
        >
          <TextField
            data-test="empty_theme_starter__name_input"
            label="Theme name"
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
            data-test="empty_theme_starter__create_button"
            startIcon={<AddIcon />}
            variant="contained"
            onClick={createTheme}
            disabled={!name.trim()}
            sx={{ minWidth: 150 }}
          >
            Create
          </Button>
        </Stack>
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
