import { useId, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { useDispatch, useSelector } from 'react-redux';
import { getCardAnswer, LanguageCard } from '../domain/cards';
import { ALL_WORDS_THEME_ID } from '../domain/themes';
import { t } from '../domain/i18n';
import {
  languageFlags,
  languageLabels,
  supportedLanguages,
  SupportedLanguage,
} from '../domain/languages';
import { addCardToTheme } from '../store/themesSlice';
import { AppDispatch, RootState } from '../store/store';

export function ThemeDetailView() {
  const dispatch = useDispatch<AppDispatch>();
  const addCardLabelId = useId();
  const [selectedCardId, setSelectedCardId] = useState('');
  const cards = useSelector((state: RootState) => state.cards.cards);
  const targetLanguage = useSelector(
    (state: RootState) => state.app.targetLanguage,
  );
  const interfaceLanguage = useSelector(
    (state: RootState) => state.app.interfaceLanguage,
  );
  const themes = useSelector((state: RootState) => state.themes.themes);
  const selectedThemeId = useSelector(
    (state: RootState) => state.themes.selectedThemeId,
  );
  const isAllWordsSelected =
    selectedThemeId === ALL_WORDS_THEME_ID || !selectedThemeId;
  const selectedTheme = isAllWordsSelected
    ? {
        id: ALL_WORDS_THEME_ID,
        name: t(interfaceLanguage, 'allWords'),
        cardIds: cards.map((card) => card.id),
        createdAt: '',
        updatedAt: '',
      }
    : themes.find(
        (theme) => theme.id === selectedThemeId && !theme.archivedAt,
      );

  if (!selectedTheme) {
    return (
      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Alert severity="info">Select a theme to manage its cards.</Alert>
      </Paper>
    );
  }

  const selectedCardIds = new Set(selectedTheme.cardIds);
  const themeCards = selectedTheme.cardIds
    .map((cardId) => cards.find((card) => card.id === cardId))
    .filter((card): card is LanguageCard => Boolean(card));
  const availableCards = isAllWordsSelected
    ? []
    : cards.filter((card) => !selectedCardIds.has(card.id));
  const addableCardId = availableCards.some((card) => card.id === selectedCardId)
    ? selectedCardId
    : '';

  const handleAddCard = () => {
    if (!addableCardId) {
      return;
    }

    dispatch(
      addCardToTheme({
        themeId: selectedTheme.id,
        cardId: addableCardId,
        now: new Date().toISOString(),
      }),
    );
    setSelectedCardId('');
  };

  return (
    <Paper sx={{ p: { xs: 2, md: 3 } }}>
      <Stack spacing={2.5}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 800 }}>
              {selectedTheme.name}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              Target answer: {languageFlags[targetLanguage]}{' '}
              {languageLabels[targetLanguage]}
            </Typography>
          </Box>
          <Chip
            label={`${themeCards.length} cards`}
            color="primary"
            variant="outlined"
          />
        </Stack>

        {!isAllWordsSelected && (
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
            <FormControl fullWidth disabled={availableCards.length === 0}>
              <InputLabel id={addCardLabelId}>
                {t(interfaceLanguage, 'add')}
              </InputLabel>
              <Select
                labelId={addCardLabelId}
                label={t(interfaceLanguage, 'add')}
                value={addableCardId}
                onChange={(event: SelectChangeEvent) =>
                  setSelectedCardId(event.target.value)
                }
              >
                {availableCards.map((card) => (
                  <MenuItem key={card.id} value={card.id}>
                    {getCardLabel(card, targetLanguage)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              onClick={handleAddCard}
              disabled={!addableCardId}
              sx={{ minWidth: 150 }}
            >
              {t(interfaceLanguage, 'add')}
            </Button>
          </Stack>
        )}

        {!isAllWordsSelected && cards.length === 0 && (
          <Alert severity="info">Import cards before adding them to a theme.</Alert>
        )}

        {!isAllWordsSelected && cards.length > 0 && availableCards.length === 0 && (
          <Alert severity="success">All imported cards are in this theme.</Alert>
        )}

        <Divider />

        {themeCards.length === 0 ? (
          <Typography color="text.secondary">
            {isAllWordsSelected
              ? 'Import cards to fill this list.'
              : 'Add imported cards to start this theme.'}
          </Typography>
        ) : (
          <List disablePadding>
            {themeCards.map((card) => {
              const answer = getDisplayAnswer(card, targetLanguage);

              return (
                <ListItem
                  key={card.id}
                  disableGutters
                  sx={{
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    py: 1.5,
                  }}
                >
                  <ListItemText
                    primary={answer.text}
                    secondary={
                      answer.isFallback
                        ? 'Fallback translation shown'
                        : `${languageLabels[targetLanguage]} answer`
                    }
                    primaryTypographyProps={{ fontWeight: 700 }}
                  />
                  {card.difficulty && (
                    <Chip
                      label={card.difficulty}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </ListItem>
              );
            })}
          </List>
        )}
      </Stack>
    </Paper>
  );
}

function getCardLabel(
  card: LanguageCard,
  targetLanguage: SupportedLanguage,
): string {
  const answer = getDisplayAnswer(card, targetLanguage);
  return answer.text;
}

function getDisplayAnswer(
  card: LanguageCard,
  targetLanguage: SupportedLanguage,
): { text: string; isFallback: boolean } {
  const targetAnswer = getCardAnswer(card, targetLanguage);
  if (targetAnswer) {
    return { text: targetAnswer, isFallback: false };
  }

  for (const language of supportedLanguages) {
    const fallback = card.translations[language];
    if (fallback) {
      return {
        text: `${languageLabels[language]}: ${fallback}`,
        isFallback: true,
      };
    }
  }

  return { text: 'No translation available', isFallback: true };
}
