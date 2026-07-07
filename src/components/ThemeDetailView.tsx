import { type ReactElement, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
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
import { setThemeCards } from '../store/themesSlice';
import { AppDispatch, RootState } from '../store/store';
import { CursorAnchoredTooltip } from './CursorAnchoredTooltip';
import { SplitWordStatsChip } from './SplitWordStatsChip';

export function ThemeDetailView() {
  const dispatch = useDispatch<AppDispatch>();
  const [isEditingCards, setIsEditingCards] = useState(false);
  const [draftCardIds, setDraftCardIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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

  const themeCards = selectedTheme.cardIds
    .map((cardId) => cards.find((card) => card.id === cardId))
    .filter((card): card is LanguageCard => Boolean(card));
  const cardsForList = isEditingCards && !isAllWordsSelected ? cards : themeCards;
  const existingThemeCardIds = new Set(
    isAllWordsSelected ? [] : selectedTheme.cardIds,
  );
  const draftCardIdSet = new Set(
    isEditingCards ? draftCardIds : selectedTheme.cardIds,
  );
  const hasDraftChanges = isEditingCards
    ? !areCardIdSetsEqual(draftCardIds, selectedTheme.cardIds)
    : false;
  const editButtonLabelKey = isEditingCards
    ? 'saveWords'
    : themeCards.length === 0
      ? 'addCards'
      : 'addWords';
  const filteredCardsForList = cardsForList.filter((card) =>
    cardMatchesSearch(card, searchQuery),
  );
  const sortedThemeCards = [...filteredCardsForList].sort((left, right) => {
    const leftAttempts = getCardAttempts(left.id, cardStats, targetLanguage);
    const rightAttempts = getCardAttempts(right.id, cardStats, targetLanguage);

    if (leftAttempts !== rightAttempts) {
      return rightAttempts - leftAttempts;
    }

    return getCardLabel(left, targetLanguage, interfaceLanguage).localeCompare(
      getCardLabel(right, targetLanguage, interfaceLanguage),
    );
  });

  const handleEditButtonClick = () => {
    if (isAllWordsSelected) {
      return;
    }

    if (!isEditingCards) {
      setDraftCardIds(selectedTheme.cardIds);
      setIsEditingCards(true);
      return;
    }

    if (!hasDraftChanges) {
      return;
    }

    dispatch(
      setThemeCards({
        themeId: selectedTheme.id,
        cardIds: cards
          .filter((card) => draftCardIdSet.has(card.id))
          .map((card) => card.id),
        now: new Date().toISOString(),
      }),
    );
    setIsEditingCards(false);
    setDraftCardIds([]);
  };

  const handleDraftCardToggle = (cardId: string) => {
    setDraftCardIds((current) =>
      current.includes(cardId)
        ? current.filter((item) => item !== cardId)
        : [...current, cardId],
    );
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
            {!isAllWordsSelected && (
              <Button
                data-test={`theme_detail__edit_cards_button__${selectedTheme.id}`}
                disabled={isEditingCards && !hasDraftChanges}
                onClick={handleEditButtonClick}
                startIcon={
                  isEditingCards ? <CheckCircleRoundedIcon /> : <AddIcon />
                }
                variant="outlined"
                sx={{
                  borderColor: '#6f4bd8',
                  color: '#5e3fc0',
                  mr: { sm: 3.75 },
                  '&:hover': {
                    bgcolor: 'rgba(111, 75, 216, 0.08)',
                    borderColor: '#5e3fc0',
                  },
                }}
              >
                {t(interfaceLanguage, editButtonLabelKey)}
              </Button>
            )}
            <Chip
              data-test={`theme_detail__card_count_chip__${selectedTheme.id}`}
              label={formatCardCount(interfaceLanguage, themeCards.length)}
              color={isAllWordsSelected ? 'primary' : 'default'}
              variant="outlined"
              sx={
                isAllWordsSelected
                  ? undefined
                  : {
                      borderColor: '#6f4bd8',
                      color: '#5e3fc0',
                      fontWeight: 750,
                    }
              }
            />
          </Stack>
        </Stack>

        {cards.length > 0 && (
          <TextField
            data-test={`theme_detail__search_input__${selectedTheme.id}`}
            fullWidth
            label={t(interfaceLanguage, 'searchCards')}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        )}

        {!isAllWordsSelected && cards.length === 0 && (
          <Alert
            data-test={`theme_detail__import_cards_alert__${selectedTheme.id}`}
            severity="info"
          >
            {t(interfaceLanguage, 'importCardsBeforeTheme')}
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
              const translationNote = getTranslationNote({
                card,
                interfaceLanguage,
                targetLanguage,
              });
              const isPhrase = isPhraseCard(card, targetLanguage);
              const isDraftSelected = draftCardIdSet.has(card.id);
              const isAlreadyInTheme = isEditingCards
                ? isDraftSelected
                : existingThemeCardIds.has(card.id);
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
                      useFlexGap
                      sx={{ flexWrap: 'wrap', minWidth: 0, width: '100%' }}
                    >
                      <Stack
                        data-test={`theme_detail__card_identity__${card.id}`}
                        direction="row"
                        spacing={1}
                        sx={{
                          alignItems: 'flex-start',
                          flex: '1 1 360px',
                          minWidth: 0,
                        }}
                      >
                        {isEditingCards && !isAllWordsSelected && (
                          <Stack
                            data-test={`theme_detail__card_select_control__${card.id}`}
                            direction="row"
                            spacing={0.75}
                            sx={{ alignItems: 'center', flexShrink: 0 }}
                          >
                            <Checkbox
                              checked={isDraftSelected}
                              onChange={() => handleDraftCardToggle(card.id)}
                              slotProps={{
                                input: {
                                  'data-test': `theme_detail__card_select_checkbox__${card.id}`,
                                } as Record<string, string>,
                              }}
                              sx={{
                                color: '#6f4bd8',
                                p: 0.5,
                                '&.Mui-checked': { color: '#6f4bd8' },
                              }}
                            />
                          </Stack>
                        )}
                        <Box
                          data-test={`theme_detail__card_text_block__${card.id}`}
                          sx={{ minWidth: 0 }}
                        >
                          <Typography
                            data-test={`theme_detail__card_answer__${card.id}`}
                            fontWeight={800}
                            sx={{
                              overflowWrap: 'anywhere',
                              wordBreak: 'break-word',
                            }}
                          >
                            {answer.text}
                          </Typography>
                          <Typography
                            color="text.secondary"
                            data-test={`theme_detail__card_language_note__${card.id}`}
                            sx={{
                              overflowWrap: 'anywhere',
                              wordBreak: 'break-word',
                            }}
                            variant="body2"
                          >
                            {answer.isFallback
                              ? t(interfaceLanguage, 'fallbackTranslationShown')
                              : translationNote}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack
                        data-test={`theme_detail__card_meta__${card.id}`}
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        useFlexGap
                        sx={{
                          alignItems: 'center',
                          flex: '0 1 auto',
                          justifyContent: 'flex-end',
                          maxWidth: '100%',
                          minWidth: 0,
                        }}
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
      placement="right-start"
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

function areCardIdSetsEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  const rightIds = new Set(right);
  return left.every((cardId) => rightIds.has(cardId));
}

function cardMatchesSearch(card: LanguageCard, searchQuery: string): boolean {
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return [
    card.id,
    ...Object.values(card.translations),
    ...Object.values(card.definitions ?? {}),
    ...Object.values(card.examples ?? {}).flatMap((examples) =>
      examples.map((example) => `${example.sentence} ${example.answer ?? ''}`),
    ),
  ]
    .filter((value): value is string => Boolean(value))
    .some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
}

function getTranslationNote({
  card,
  interfaceLanguage,
  targetLanguage,
}: {
  card: LanguageCard;
  interfaceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
}): string {
  const notes = supportedLanguages
    .filter((language) => language !== targetLanguage)
    .map((language) => {
      const translation = card.translations[language];
      return translation ? `${language}: ${translation}` : undefined;
    })
    .filter((note): note is string => Boolean(note));

  return notes.length > 0
    ? notes.join(' / ')
    : t(interfaceLanguage, 'noTranslationAvailable');
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
