import { type ReactElement, useId, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import {
  Alert,
  Box,
  Button,
  Checkbox,
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
import { CursorAnchoredTooltip } from './CursorAnchoredTooltip';
import { SplitWordStatsChip } from './SplitWordStatsChip';

export function ThemeDetailView({
  isCardSelectionMode = false,
  onAddSelectedCardsToTheme,
  onPendingThemeCardToggle,
  pendingThemeCardIds = [],
}: {
  isCardSelectionMode?: boolean;
  onAddSelectedCardsToTheme?: () => void;
  onPendingThemeCardToggle?: (cardId: string) => void;
  pendingThemeCardIds?: string[];
}) {
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
  const allAttempts = useSelector(
    (state: RootState) => state.attempts.attempts,
  );
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
  const cardsForList = isCardSelectionMode ? cards : themeCards;
  const existingThemeCardIds = new Set(
    isAllWordsSelected ? [] : selectedTheme.cardIds,
  );
  const pendingThemeCardIdSet = new Set(pendingThemeCardIds);
  const sortedThemeCards = [...cardsForList].sort((left, right) => {
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
          <Stack
            data-test={`theme_detail__header_actions__${selectedTheme.id}`}
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', flexWrap: 'wrap' }}
            useFlexGap
          >
            {isCardSelectionMode && (
              <Button
                data-test="theme_detail__add_selected_cards_button"
                disabled={pendingThemeCardIds.length === 0}
                onClick={onAddSelectedCardsToTheme}
                startIcon={<CheckCircleRoundedIcon />}
                variant="contained"
                sx={{
                  bgcolor: '#6f4bd8',
                  mr: { sm: 3.75 },
                  '&:hover': { bgcolor: '#5e3fc0' },
                }}
              >
                {t(interfaceLanguage, 'addToTheme')}
              </Button>
            )}
            <Chip
              data-test={`theme_detail__card_count_chip__${selectedTheme.id}`}
              label={formatCardCount(interfaceLanguage, themeCards.length)}
              color="primary"
              variant="outlined"
            />
          </Stack>
        </Stack>

        {isCardSelectionMode && (
          <Alert
            data-test="theme_detail__selection_mode_banner"
            severity="info"
            sx={{
              bgcolor: '#f5efff',
              border: '1px solid rgba(111, 75, 216, 0.20)',
              color: '#3b2a68',
              '& .MuiAlert-icon': { color: '#6f4bd8' },
            }}
          >
            {t(interfaceLanguage, 'themeCardSelectionMode')}
          </Alert>
        )}

        {!isCardSelectionMode && !isAllWordsSelected && (
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

        {cardsForList.length === 0 ? (
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
              const isAlreadyInTheme = existingThemeCardIds.has(card.id);
              const isPending = pendingThemeCardIdSet.has(card.id);
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
                    border: '1px solid',
                    borderColor: isAlreadyInTheme
                      ? 'rgba(111, 75, 216, 0.52)'
                      : 'rgba(32, 48, 21, 0.14)',
                    borderLeft: '4px solid',
                    borderLeftColor: isAlreadyInTheme
                      ? '#6f4bd8'
                      : 'primary.main',
                    borderRadius: 1,
                    bgcolor: isAlreadyInTheme
                      ? 'rgba(111, 75, 216, 0.045)'
                      : 'background.paper',
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
                      <Stack
                        data-test={`theme_detail__card_identity__${card.id}`}
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: 'flex-start', minWidth: 0 }}
                      >
                        {isCardSelectionMode && (
                          <Checkbox
                            checked={isAlreadyInTheme || isPending}
                            disabled={isAlreadyInTheme}
                            onChange={() => onPendingThemeCardToggle?.(card.id)}
                            slotProps={{
                              input: {
                                'data-test': `theme_detail__card_select_checkbox__${card.id}`,
                              } as Record<string, string>,
                            }}
                            sx={{
                              color: '#6f4bd8',
                              mt: -0.65,
                              p: 0.5,
                              '&.Mui-checked': { color: '#6f4bd8' },
                            }}
                          />
                        )}
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
                      </Stack>
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
                            height: 30,
                          }}
                        />
                        <RecentCardStatsTooltip
                          dataTestPrefix={`theme_detail__card_stats__${card.id}`}
                          interfaceLanguage={interfaceLanguage}
                          recentResults={getRecentCardResults({
                            attempts: allAttempts,
                            cardId: card.id,
                            limit: 20,
                            targetLanguage,
                          })}
                          subject={answer.text}
                        >
                          <SplitWordStatsChip
                            correct={stats?.correct ?? 0}
                            dataTestPrefix={`theme_detail__card_stats__${card.id}`}
                            incorrect={stats?.incorrect ?? 0}
                            interfaceLanguage={interfaceLanguage}
                            statsLabel={statsLabel}
                          />
                        </RecentCardStatsTooltip>
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

function RecentCardStatsTooltip({
  children,
  dataTestPrefix,
  interfaceLanguage,
  recentResults,
  subject,
}: {
  children: ReactElement;
  dataTestPrefix: string;
  interfaceLanguage: SupportedLanguage;
  recentResults: RecentCardResult[];
  subject: string;
}) {
  return (
    <CursorAnchoredTooltip
      arrowDataTest={`${dataTestPrefix}__tooltip_arrow`}
      closeOnOtherOpen
      leaveDelay={0}
      preventOverflow
      transitionTimeout={0}
      tooltipSx={recentCardStatsTooltipStyles}
      title={
        <Stack data-test={`${dataTestPrefix}__recent_tooltip`} spacing={0.75}>
          <Typography
            data-test={`${dataTestPrefix}__recent_tooltip_title`}
            sx={{ color: '#203015', fontSize: 14, fontWeight: 850 }}
          >
            {t(interfaceLanguage, 'recent20AnswersTitle')}
          </Typography>
          <Typography
            data-test={`${dataTestPrefix}__recent_tooltip_subject`}
            sx={{
              color: 'rgba(32, 48, 21, 0.68)',
              fontSize: 11,
              fontWeight: 750,
              lineHeight: 1.25,
            }}
          >
            {subject}
          </Typography>
          <Stack
            data-test={`${dataTestPrefix}__recent_results`}
            spacing={0.5}
            sx={{
              maxHeight: 'min(360px, calc(100vh - 178px))',
              overflowY: 'auto',
              pr: 0.5,
            }}
          >
            {recentResults.map((result, index) => (
              <Stack
                data-test={`${dataTestPrefix}__recent_result__${index}`}
                direction="row"
                key={`${result.occurredAt}-${index}`}
                spacing={0.75}
                sx={{ alignItems: 'center' }}
              >
                <Chip
                  data-test={`${dataTestPrefix}__recent_result_chip__${index}`}
                  label={t(
                    interfaceLanguage,
                    result.isCorrect
                      ? 'metricCorrectSuffix'
                      : 'metricIncorrectSuffix',
                  )}
                  size="small"
                  sx={{
                    bgcolor: result.isCorrect
                      ? 'rgb(235, 247, 225)'
                      : 'rgb(253, 235, 238)',
                    border: '1px solid',
                    borderColor: result.isCorrect ? '#8fc773' : '#f2a7b4',
                    color: '#111111',
                    fontSize: 12,
                    fontWeight: 800,
                    height: 24,
                  }}
                />
                <Typography
                  data-test={`${dataTestPrefix}__recent_result_date__${index}`}
                  sx={{ color: 'rgba(32, 48, 21, 0.72)', fontSize: 11 }}
                >
                  {formatAttemptDate(result.occurredAt)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      }
    >
      <Box data-test={`${dataTestPrefix}__tooltip_anchor`} sx={{ display: 'inline-flex' }}>
        {children}
      </Box>
    </CursorAnchoredTooltip>
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

type RecentCardResult = {
  isCorrect: boolean;
  occurredAt: string;
};

function getRecentCardResults({
  attempts,
  cardId,
  limit,
  targetLanguage,
}: {
  attempts: RootState['attempts']['attempts'];
  cardId: string;
  limit: number;
  targetLanguage: SupportedLanguage;
}): RecentCardResult[] {
  return [...attempts]
    .filter(
      (attempt) =>
        attempt.targetLanguage === targetLanguage &&
        Object.prototype.hasOwnProperty.call(attempt.correctness, cardId),
    )
    .sort(
      (left, right) =>
        Date.parse(right.completedAt ?? right.createdAt) -
        Date.parse(left.completedAt ?? left.createdAt),
    )
    .slice(0, limit)
    .map((attempt) => ({
      isCorrect: Boolean(attempt.correctness[cardId]),
      occurredAt: attempt.completedAt ?? attempt.createdAt,
    }));
}

function formatAttemptDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return [
    `${padDatePart(date.getMonth() + 1)}/${padDatePart(
      date.getDate(),
    )}/${date.getFullYear()}`,
    `${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`,
  ].join(' ');
}

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

const recentCardStatsTooltipStyles = {
  bgcolor: '#ffffff',
  border: '1px solid rgba(32, 48, 21, 0.14)',
  boxShadow: '0 12px 28px rgba(32, 48, 21, 0.14)',
  color: '#203015',
  p: 1.25,
};
