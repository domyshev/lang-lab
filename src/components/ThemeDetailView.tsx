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
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { useDispatch, useSelector } from 'react-redux';
import { getCardAnswer, isPhraseValue, LanguageCard } from '../domain/cards';
import { ALL_WORDS_THEME_ID } from '../domain/themes';
import {
  formatCardCount,
  getLanguageDisplayName,
  t,
} from '../domain/i18n';
import {
  languageFlags,
  supportedLanguages,
  SupportedLanguage,
} from '../domain/languages';
import { addCardToTheme } from '../store/themesSlice';
import { AppDispatch, RootState } from '../store/store';
import { SplitWordStatsChip } from './SplitWordStatsChip';

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
  const cardStats = useSelector((state: RootState) => state.stats.cardStats);
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
      <Paper
        data-test="theme_detail__empty_panel"
        sx={{ p: { xs: 2, md: 3 } }}
      >
        <Alert data-test="theme_detail__select_theme_alert" severity="info">
          {t(interfaceLanguage, 'selectThemeToManage')}
        </Alert>
      </Paper>
    );
  }

  const selectedCardIds = new Set(selectedTheme.cardIds);
  const themeCards = selectedTheme.cardIds
    .map((cardId) => cards.find((card) => card.id === cardId))
    .filter((card): card is LanguageCard => Boolean(card));
  const sortedThemeCards = [...themeCards].sort((left, right) => {
    const leftAttempts = getCardAttempts(left.id, cardStats, targetLanguage);
    const rightAttempts = getCardAttempts(right.id, cardStats, targetLanguage);

    if (leftAttempts !== rightAttempts) {
      return rightAttempts - leftAttempts;
    }

    return getCardLabel(left, targetLanguage, interfaceLanguage).localeCompare(
      getCardLabel(right, targetLanguage, interfaceLanguage),
    );
  });
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
    <Paper
      data-test={`theme_detail__panel__${selectedTheme.id}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        maxHeight: { md: 'calc(100vh - 118px)' },
        minHeight: 0,
        p: { xs: 2, md: 3 },
      }}
    >
      <Stack
        data-test={`theme_detail__content__${selectedTheme.id}`}
        spacing={2.5}
        sx={{ flex: 1, minHeight: 0 }}
      >
        <Stack
          data-test={`theme_detail__header__${selectedTheme.id}`}
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
        >
          <Box data-test={`theme_detail__header_text__${selectedTheme.id}`}>
            <Typography
              data-test={`theme_detail__title__${selectedTheme.id}`}
              variant="h5"
              component="h2"
              sx={{ fontWeight: 800 }}
            >
              {selectedTheme.name}
            </Typography>
            <Typography
              color="text.secondary"
              data-test={`theme_detail__target_answer__${selectedTheme.id}`}
              sx={{ mt: 0.5 }}
            >
              {t(interfaceLanguage, 'targetAnswerLabel')}:{' '}
              {languageFlags[targetLanguage]}{' '}
              {getLanguageDisplayName(interfaceLanguage, targetLanguage)}
            </Typography>
          </Box>
          <Chip
            data-test={`theme_detail__card_count_chip__${selectedTheme.id}`}
            label={formatCardCount(interfaceLanguage, themeCards.length)}
            color="primary"
            variant="outlined"
          />
        </Stack>

        {!isAllWordsSelected && (
          <Stack
            data-test={`theme_detail__add_card_form__${selectedTheme.id}`}
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
            <FormControl
              data-test={`theme_detail__add_card_control__${selectedTheme.id}`}
              fullWidth
              disabled={availableCards.length === 0}
            >
              <InputLabel
                data-test={`theme_detail__add_card_label__${selectedTheme.id}`}
                id={addCardLabelId}
              >
                {t(interfaceLanguage, 'add')}
              </InputLabel>
              <Select
                data-test={`theme_detail__add_card_select__${selectedTheme.id}`}
                labelId={addCardLabelId}
                label={t(interfaceLanguage, 'add')}
                value={addableCardId}
                onChange={(event: SelectChangeEvent) =>
                  setSelectedCardId(event.target.value)
                }
              >
                {availableCards.map((card) => (
                  <MenuItem
                    data-test={`theme_detail__add_card_option__${card.id}`}
                    key={card.id}
                    value={card.id}
                  >
                    {getCardLabel(card, targetLanguage, interfaceLanguage)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              data-test={`theme_detail__add_card_button__${selectedTheme.id}`}
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
          <Alert
            data-test={`theme_detail__import_cards_alert__${selectedTheme.id}`}
            severity="info"
          >
            {t(interfaceLanguage, 'importCardsBeforeTheme')}
          </Alert>
        )}

        {!isAllWordsSelected && cards.length > 0 && availableCards.length === 0 && (
          <Alert
            data-test={`theme_detail__all_cards_added_alert__${selectedTheme.id}`}
            severity="success"
          >
            {t(interfaceLanguage, 'allImportedCardsInTheme')}
          </Alert>
        )}

        <Divider />

        {themeCards.length === 0 ? (
          <Typography
            color="text.secondary"
            data-test={`theme_detail__empty_cards_message__${selectedTheme.id}`}
          >
            {isAllWordsSelected
              ? t(interfaceLanguage, 'importCardsToFillList')
              : t(interfaceLanguage, 'addImportedCardsToStartTheme')}
          </Typography>
        ) : (
          <Stack
            data-test={`theme_detail__cards_list__${selectedTheme.id}`}
            spacing={1.25}
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              pr: 0.5,
            }}
          >
            {sortedThemeCards.map((card) => {
              const answer = getDisplayAnswer(
                card,
                targetLanguage,
                interfaceLanguage,
              );
              const isPhrase = isPhraseCard(card, targetLanguage);
              const stats = cardStats.find(
                (item) =>
                  item.cardId === card.id &&
                  item.targetLanguage === targetLanguage,
              );
              const statsLabel = t(
                interfaceLanguage,
                isPhrase ? 'phraseStats' : 'wordStats',
              );

              return (
                <Box
                  data-test={`theme_detail__card_item__${card.id}`}
                  key={card.id}
                  sx={{
                    border: '1px solid rgba(32, 48, 21, 0.14)',
                    borderLeft: '4px solid',
                    borderLeftColor: 'primary.main',
                    borderRadius: 1,
                    p: 1.5,
                  }}
                >
                  <Stack data-test={`theme_detail__card_content__${card.id}`} spacing={1}>
                    <Stack
                      data-test={`theme_detail__card_header__${card.id}`}
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1}
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      justifyContent="space-between"
                    >
                      <Box data-test={`theme_detail__card_text_block__${card.id}`}>
                        <Typography
                          data-test={`theme_detail__card_answer__${card.id}`}
                          fontWeight={800}
                        >
                          {answer.text}
                        </Typography>
                        <Typography
                          color="text.secondary"
                          data-test={`theme_detail__card_language_note__${card.id}`}
                          variant="body2"
                        >
                          {answer.isFallback
                            ? t(interfaceLanguage, 'fallbackTranslationShown')
                            : `${getLanguageDisplayName(
                                interfaceLanguage,
                                targetLanguage,
                              )} ${t(interfaceLanguage, 'targetLanguageAnswer')}`}
                        </Typography>
                      </Box>
                      <Stack
                        data-test={`theme_detail__card_meta__${card.id}`}
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        useFlexGap
                        sx={{ alignItems: 'center' }}
                      >
                        <Chip
                          data-test={`theme_detail__card_kind_chip__${card.id}`}
                          label={t(
                            interfaceLanguage,
                            isPhrase ? 'phraseLabel' : 'wordLabel',
                          )}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: 'rgba(32, 48, 21, 0.28)',
                            color: '#203015',
                            fontWeight: 800,
                            height: 38,
                          }}
                        />
                        <SplitWordStatsChip
                          correct={stats?.correct ?? 0}
                          dataTestPrefix={`theme_detail__card_stats__${card.id}`}
                          incorrect={stats?.incorrect ?? 0}
                          interfaceLanguage={interfaceLanguage}
                          statsLabel={statsLabel}
                        />
                      </Stack>
                    </Stack>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

function getCardAttempts(
  cardId: string,
  cardStats: RootState['stats']['cardStats'],
  targetLanguage: SupportedLanguage,
): number {
  return (
    cardStats.find(
      (item) => item.cardId === cardId && item.targetLanguage === targetLanguage,
    )?.attempts ?? 0
  );
}

function isPhraseCard(
  card: LanguageCard,
  targetLanguage: SupportedLanguage,
): boolean {
  const targetAnswer = getCardAnswer(card, targetLanguage);
  if (targetAnswer) {
    return isPhraseValue(targetAnswer);
  }

  return Object.values(card.translations).some(
    (translation) => translation && isPhraseValue(translation),
  );
}

function getCardLabel(
  card: LanguageCard,
  targetLanguage: SupportedLanguage,
  interfaceLanguage: SupportedLanguage,
): string {
  const answer = getDisplayAnswer(card, targetLanguage, interfaceLanguage);
  return answer.text;
}

function getDisplayAnswer(
  card: LanguageCard,
  targetLanguage: SupportedLanguage,
  interfaceLanguage: SupportedLanguage = 'en',
): { text: string; isFallback: boolean } {
  const targetAnswer = getCardAnswer(card, targetLanguage);
  if (targetAnswer) {
    return { text: targetAnswer, isFallback: false };
  }

  for (const language of supportedLanguages) {
    const fallback = card.translations[language];
    if (fallback) {
      return {
        text: `${getLanguageDisplayName(interfaceLanguage, language)}: ${fallback}`,
        isFallback: true,
      };
    }
  }

  return {
    text: t(interfaceLanguage, 'noTranslationAvailable'),
    isFallback: true,
  };
}
