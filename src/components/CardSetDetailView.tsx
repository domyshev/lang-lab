// lang-lab — a language learning laboratory
// Copyright (C) 2026  Ilia Domyshev <ilia@domyshev.com>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published
// by the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { type ReactElement, useId, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import {
  getCardAnswer,
  isCardKnownForTarget,
  isPhraseValue,
  LanguageCard,
} from '../domain/cards';
import {
  ALL_CARDS_CARD_SET_ID,
  getCardSetName,
  isArchivedCardSet,
} from '../domain/cardSets';
import {
  getWorldAccent,
  getWorldResultColors,
  resolveWorldId,
  forestLilacAccent,
  type WorldResultColors,
} from '../domain/worlds';
import {
  createCardById,
  createCardStatsByTarget,
  getCardsByIds,
} from '../domain/cardIndexes';
import {
  createRecentResultsByCardId,
  type RecentCardResult,
} from '../domain/cardResultHistory';
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
import {
  copyArchivedCardSet,
  setCardSetCards,
} from '../store/cardSetsSlice';
import { setCardKnown } from '../store/cardsSlice';
import { AppDispatch, RootState } from '../store/store';
import { CursorAnchoredTooltip } from './CursorAnchoredTooltip';
import { KnownCardToggleButton } from './KnownCardToggleButton';
import { SplitWordStatsChip } from './SplitWordStatsChip';

export function CardSetDetailView() {
  const dispatch = useDispatch<AppDispatch>();
  const [isEditingCards, setIsEditingCards] = useState(false);
  const [isCancelEditDialogOpen, setIsCancelEditDialogOpen] = useState(false);
  const [draftCardIds, setDraftCardIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const cancelEditDialogTitleId = useId();
  const worldId = useSelector((state: RootState) =>
    resolveWorldId(state.app.worldId),
  );
  const worldAccent = getWorldAccent(worldId);
  const cardStatsResultColors = getCardDetailStatsColors(worldId);
  const cardSetAccentMain =
    worldId === 'forest' ? forestLilacAccent.main : worldAccent.main;
  const cardSetAccentBorder =
    worldId === 'forest'
      ? forestLilacAccent.border
      : hexToRgba(worldAccent.main, 0.52);
  const cardSetAccentHover =
    worldId === 'forest'
      ? forestLilacAccent.glow
      : hexToRgba(worldAccent.main, 0.08);
  const cardSetAccentSoft =
    worldId === 'forest'
      ? forestLilacAccent.soft
      : hexToRgba(worldAccent.main, 0.055);
  const cardsListRef = useRef<HTMLDivElement | null>(null);
  const cards = useSelector((state: RootState) => state.cards.cards);
  const targetLanguage = useSelector(
    (state: RootState) => state.app.targetLanguage,
  );
  const interfaceLanguage = useSelector(
    (state: RootState) => state.app.interfaceLanguage,
  );
  const cardSets = useSelector((state: RootState) => state.cardSets.cardSets);
  const cardStats = useSelector((state: RootState) => state.stats.cardStats);
  const allAttempts = useSelector(
    (state: RootState) => state.attempts.attempts,
  );
  const selectedCardSetId = useSelector(
    (state: RootState) => state.cardSets.selectedCardSetId,
  );
  const cardById = useMemo(() => createCardById(cards), [cards]);
  const cardStatsById = useMemo(
    () => createCardStatsByTarget(cardStats, targetLanguage),
    [cardStats, targetLanguage],
  );
  const recentResultsByCardId = useMemo(
    () =>
      createRecentResultsByCardId({
        attempts: allAttempts,
        limit: 20,
        targetLanguage,
      }),
    [allAttempts, targetLanguage],
  );
  const isAllCardsSelected =
    selectedCardSetId === ALL_CARDS_CARD_SET_ID || !selectedCardSetId;
  const selectedCardSet = isAllCardsSelected
    ? {
        id: ALL_CARDS_CARD_SET_ID,
        name: t(targetLanguage, 'allCards'),
        cardIds: cards.map((card) => card.id),
        createdAt: '',
        updatedAt: '',
      }
    : cardSets.find((cardSet) => cardSet.id === selectedCardSetId);
  const isArchivedSelectedCardSet =
    selectedCardSet && !isAllCardsSelected && isArchivedCardSet(selectedCardSet);
  const canEditSelectedCardSet =
    !isAllCardsSelected && !isArchivedSelectedCardSet;
  const selectedCardSetName = selectedCardSet
    ? getCardSetName(selectedCardSet, targetLanguage)
    : '';

  if (!selectedCardSet) {
    return (
      <Paper
        data-test="card_set_detail__empty_panel"
        sx={{ p: { xs: 2, md: 3 } }}
      >
        <Alert data-test="card_set_detail__select_card_set_alert" severity="info">
          {t(interfaceLanguage, 'selectCardSetToManage')}
        </Alert>
      </Paper>
    );
  }

  const cardSetCards = isAllCardsSelected
    ? cards
    : getCardsByIds(cardById, selectedCardSet.cardIds);
  const cardsForList =
    isEditingCards && canEditSelectedCardSet ? cards : cardSetCards;
  const existingCardSetCardIds = new Set(
    isAllCardsSelected ? [] : selectedCardSet.cardIds,
  );
  const draftCardIdSet = new Set(
    isEditingCards ? draftCardIds : selectedCardSet.cardIds,
  );
  const hasDraftChanges = isEditingCards
    ? !areCardIdSetsEqual(draftCardIds, selectedCardSet.cardIds)
    : false;
  const canSaveCardSetDraft = hasDraftChanges && draftCardIds.length > 0;
  const editButtonLabelKey = isEditingCards
    ? 'saveCardsInSet'
    : cardSetCards.length === 0
      ? 'addCards'
      : 'addCardsToSet';
  const filteredCardsForList = cardsForList.filter((card) =>
    cardMatchesSearch(card, searchQuery),
  );
  const sortedCardSetCards = [...filteredCardsForList].sort((left, right) => {
    const leftAttempts = getCardAttempts(left.id, cardStats, targetLanguage);
    const rightAttempts = getCardAttempts(right.id, cardStats, targetLanguage);

    if (leftAttempts !== rightAttempts) {
      return rightAttempts - leftAttempts;
    }

    return getCardLabel(left, targetLanguage, interfaceLanguage).localeCompare(
      getCardLabel(right, targetLanguage, interfaceLanguage),
    );
  });
  const shouldVirtualizeCards = sortedCardSetCards.length > 100;
  const cardRowEstimatedSize = 126;
  const cardRowVirtualizer = useVirtualizer({
    count: sortedCardSetCards.length,
    estimateSize: () => cardRowEstimatedSize,
    getItemKey: (index) => sortedCardSetCards[index]?.id ?? index,
    getScrollElement: () => cardsListRef.current,
    initialRect: { height: 720, width: 960 },
    overscan: 8,
  });
  const virtualCardRows = shouldVirtualizeCards
    ? cardRowVirtualizer.getVirtualItems()
    : [];
  const displayedVirtualCardRows =
    shouldVirtualizeCards && virtualCardRows.length === 0
      ? sortedCardSetCards.slice(0, 16).map((card, index) => ({
          index,
          key: card.id,
          start: index * cardRowEstimatedSize,
        }))
      : virtualCardRows;

  const startEditingCards = () => {
    if (!canEditSelectedCardSet) {
      return;
    }

    setDraftCardIds(selectedCardSet.cardIds);
    setIsEditingCards(true);
  };

  const saveEditedCards = () => {
    if (!canEditSelectedCardSet || !canSaveCardSetDraft) {
      return;
    }

    dispatch(
      setCardSetCards({
        cardSetId: selectedCardSet.id,
        cardIds: cards
          .filter((card) => draftCardIdSet.has(card.id))
          .map((card) => card.id),
        now: new Date().toISOString(),
      }),
    );
    setIsEditingCards(false);
    setDraftCardIds([]);
  };

  const discardEditedCards = () => {
    setIsCancelEditDialogOpen(false);
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

  const handleKnownToggle = (cardId: string, isKnown: boolean) => {
    dispatch(
      setCardKnown({
        cardId,
        isKnown,
        now: new Date().toISOString(),
        targetLanguage,
      }),
    );
  };

  const renderCardRow = (card: LanguageCard) => {
    const answer = getDisplayAnswer(card, targetLanguage, interfaceLanguage);
    const translationNote = getTranslationNote({
      card,
      interfaceLanguage,
      targetLanguage,
    });
    const isPhrase = isPhraseCard(card, targetLanguage);
    const isDraftSelected = draftCardIdSet.has(card.id);
    const isAlreadyInCardSet = isEditingCards
      ? isDraftSelected
      : existingCardSetCardIds.has(card.id);
    const stats = cardStatsById.get(card.id);
    const statsLabel = t(
      interfaceLanguage,
      isPhrase ? 'phraseStats' : 'wordStats',
    );
    const isKnown = isCardKnownForTarget(card, targetLanguage);

    return (
      <Box
        data-test={`card_set_detail__card_item__${card.id}`}
        key={card.id}
        sx={{
          border: '1px solid',
          borderColor: isAlreadyInCardSet
            ? cardSetAccentBorder
            : 'rgba(32, 48, 21, 0.14)',
          borderLeft: '4px solid',
          borderLeftColor: isAlreadyInCardSet ? cardSetAccentMain : 'primary.main',
          borderRadius: 1,
          bgcolor: isAlreadyInCardSet
            ? cardSetAccentSoft
            : 'background.paper',
          p: 1.5,
        }}
      >
        <Stack data-test={`card_set_detail__card_content__${card.id}`} spacing={1}>
          <Stack
            data-test={`card_set_detail__card_header__${card.id}`}
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            useFlexGap
            sx={{ flexWrap: 'wrap', minWidth: 0, width: '100%' }}
          >
            <Stack
              data-test={`card_set_detail__card_identity__${card.id}`}
              direction="row"
              spacing={1}
              sx={{
                alignItems: 'flex-start',
                flex: '1 1 360px',
                minWidth: 0,
              }}
            >
              {isEditingCards && canEditSelectedCardSet && (
                <Stack
                  data-test={`card_set_detail__card_select_control__${card.id}`}
                  direction="row"
                  spacing={0.75}
                  sx={{ alignItems: 'center', flexShrink: 0 }}
                >
                  <Checkbox
                    checked={isDraftSelected}
                    onChange={() => handleDraftCardToggle(card.id)}
                    slotProps={{
                      input: {
                        'data-test': `card_set_detail__card_select_checkbox__${card.id}`,
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
                data-test={`card_set_detail__card_text_block__${card.id}`}
                sx={{ minWidth: 0 }}
              >
                <Typography
                  data-test={`card_set_detail__card_answer__${card.id}`}
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
                  data-test={`card_set_detail__card_language_note__${card.id}`}
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
              data-test={`card_set_detail__card_meta__${card.id}`}
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
                data-test={`card_set_detail__card_kind_chip__${card.id}`}
                label={
                  <Box
                    component="span"
                    data-test={`card_set_detail__card_kind_chip_label__${card.id}`}
                    sx={{ alignItems: 'baseline', display: 'inline-flex' }}
                  >
                    <Box component="span" sx={{ fontWeight: 500 }}>
                      {t(interfaceLanguage, 'cardTypePrefix')}:{' '}
                    </Box>
                    <Box component="span" sx={{ fontWeight: 850 }}>
                      {t(
                        interfaceLanguage,
                        isPhrase ? 'phraseLabel' : 'wordLabel',
                      )}
                    </Box>
                  </Box>
                }
                size="small"
                variant="outlined"
                sx={{
                  borderColor: 'rgba(32, 48, 21, 0.28)',
                  color: '#203015',
                  fontSize: 11,
                  height: 24,
                  '& .MuiChip-label': {
                    px: 0.75,
                  },
                }}
              />
              <KnownCardToggleButton
                checked={isKnown}
                dataTest={`card_set_detail__known_button__${card.id}`}
                interfaceLanguage={interfaceLanguage}
                onChange={(nextIsKnown) =>
                  handleKnownToggle(card.id, nextIsKnown)
                }
              />
              <RecentCardStatsTooltip
                dataTestPrefix={`card_set_detail__card_stats__${card.id}`}
                interfaceLanguage={interfaceLanguage}
                recentResults={recentResultsByCardId.get(card.id) ?? []}
                subject={answer.text}
              >
                <SplitWordStatsChip
                  correct={stats?.correct ?? 0}
                  dataTestPrefix={`card_set_detail__card_stats__${card.id}`}
                  incorrect={stats?.incorrect ?? 0}
                  interfaceLanguage={interfaceLanguage}
                  resultColors={cardStatsResultColors}
                  size="compact"
                  statsLabel={statsLabel}
                />
              </RecentCardStatsTooltip>
            </Stack>
          </Stack>
        </Stack>
      </Box>
    );
  };

  return (
    <>
      <Paper
        data-test={`card_set_detail__panel__${selectedCardSet.id}`}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '100%',
          maxHeight: { md: 'calc(100vh - 118px)' },
          minHeight: 0,
          minWidth: 0,
          p: { xs: 2, md: 3 },
          width: '100%',
        }}
      >
        <Stack
          data-test={`card_set_detail__content__${selectedCardSet.id}`}
          spacing={2.5}
          sx={{ flex: 1, minHeight: 0, minWidth: 0 }}
        >
          <Stack
            data-test={`card_set_detail__header__${selectedCardSet.id}`}
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
          >
            <Box data-test={`card_set_detail__header_text__${selectedCardSet.id}`}>
              <Typography
                data-test={`card_set_detail__title__${selectedCardSet.id}`}
                variant="h5"
                component="h2"
                sx={{ fontWeight: 800 }}
              >
                {selectedCardSetName}
              </Typography>
              <Typography
                color="text.secondary"
                data-test={`card_set_detail__target_answer__${selectedCardSet.id}`}
                sx={{ mt: 0.5 }}
              >
                {t(interfaceLanguage, 'targetAnswerLabel')}:{' '}
                {languageFlags[targetLanguage]}{' '}
                {getLanguageDisplayName(interfaceLanguage, targetLanguage)}
              </Typography>
            </Box>
            <Stack
              data-test={`card_set_detail__header_actions__${selectedCardSet.id}`}
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', flexWrap: 'wrap' }}
              useFlexGap
            >
              {isArchivedSelectedCardSet && (
                <Chip
                  data-test={`card_set_detail__archived_chip__${selectedCardSet.id}`}
                  label={t(interfaceLanguage, 'archived')}
                  variant="outlined"
                  sx={{
                    borderColor: cardSetAccentBorder,
                    color: worldAccent.dark,
                    fontWeight: 850,
                  }}
                />
              )}
              {isArchivedSelectedCardSet && (
                <Button
                  data-test={`card_set_detail__copy_archived_button__${selectedCardSet.id}`}
                  startIcon={<AddIcon />}
                  variant="outlined"
                  onClick={() =>
                    dispatch(
                      copyArchivedCardSet({
                        sourceCardSetId: selectedCardSet.id,
                        newCardSetId: createCardSetId(),
                        now: new Date().toISOString(),
                      }),
                    )
                  }
                >
                  {t(interfaceLanguage, 'createActiveCopy')}
                </Button>
              )}
              {canEditSelectedCardSet && !isEditingCards && (
                <Button
                  data-test={`card_set_detail__edit_cards_button__${selectedCardSet.id}`}
                  onClick={startEditingCards}
                  startIcon={<AddIcon />}
                  variant="outlined"
                  sx={{
                    borderColor: cardSetAccentMain,
                    color: worldAccent.dark,
                    mr: { sm: 3.75 },
                    '&:hover': {
                      bgcolor: cardSetAccentHover,
                      borderColor: worldAccent.dark,
                    },
                  }}
                >
                  {t(interfaceLanguage, editButtonLabelKey)}
                </Button>
              )}
              {canEditSelectedCardSet && isEditingCards && (
                <Stack
                  data-test={`card_set_detail__edit_actions__${selectedCardSet.id}`}
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: 'center', mr: { sm: 3.75 } }}
                >
                  <Button
                    data-test={`card_set_detail__save_cards_button__${selectedCardSet.id}`}
                    disabled={!canSaveCardSetDraft}
                    onClick={saveEditedCards}
                    startIcon={<CheckCircleRoundedIcon />}
                    variant="outlined"
                    sx={{
                      borderColor: cardSetAccentMain,
                      color: worldAccent.dark,
                      '&:hover': {
                        bgcolor: cardSetAccentHover,
                        borderColor: worldAccent.dark,
                      },
                    }}
                  >
                    {t(interfaceLanguage, 'save')}
                  </Button>
                  <Button
                    data-test={`card_set_detail__cancel_edit_cards_button__${selectedCardSet.id}`}
                    onClick={() => setIsCancelEditDialogOpen(true)}
                    startIcon={<ClearRoundedIcon />}
                    variant="outlined"
                    sx={{
                      borderColor: 'rgba(32, 48, 21, 0.24)',
                      color: 'text.secondary',
                      '&:hover': {
                        bgcolor: 'rgba(32, 48, 21, 0.05)',
                        borderColor: 'rgba(32, 48, 21, 0.42)',
                      },
                    }}
                  >
                    {t(interfaceLanguage, 'cancelCardSetEdit')}
                  </Button>
                </Stack>
              )}
              <Chip
                data-test={`card_set_detail__card_count_chip__${selectedCardSet.id}`}
                label={formatCardCount(interfaceLanguage, cardSetCards.length)}
                color={isAllCardsSelected ? 'primary' : 'default'}
                variant="outlined"
                sx={
                  isAllCardsSelected
                    ? undefined
                    : {
                        borderColor: cardSetAccentMain,
                        color: worldAccent.dark,
                        fontWeight: 750,
                      }
                }
              />
            </Stack>
          </Stack>

        {cards.length > 0 && (
          <TextField
            data-test={`card_set_detail__search_input__${selectedCardSet.id}`}
            fullWidth
            label={t(interfaceLanguage, 'searchCards')}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            slotProps={{
              input: {
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={t(interfaceLanguage, 'clearCardSearch')}
                      data-test={`card_set_detail__search_clear_button__${selectedCardSet.id}`}
                      edge="end"
                      onClick={() => setSearchQuery('')}
                      onMouseDown={(event) => event.preventDefault()}
                      size="small"
                    >
                      <ClearRoundedIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : undefined,
              },
            }}
          />
        )}

        {!isAllCardsSelected && cards.length === 0 && (
          <Alert
            data-test={`card_set_detail__import_cards_alert__${selectedCardSet.id}`}
            severity="info"
          >
            {t(interfaceLanguage, 'importCardsBeforeCardSet')}
          </Alert>
        )}

        <Divider />

        {cardsForList.length === 0 ? (
          <Typography
            color="text.secondary"
            data-test={`card_set_detail__empty_cards_message__${selectedCardSet.id}`}
          >
            {isAllCardsSelected
              ? t(interfaceLanguage, 'importCardsToFillList')
              : t(interfaceLanguage, 'addImportedCardsToStartCardSet')}
          </Typography>
        ) : (
          <Box
            data-test={
              shouldVirtualizeCards
                ? `card_set_detail__virtualized_cards_list__${selectedCardSet.id}`
                : `card_set_detail__cards_list__${selectedCardSet.id}`
            }
            ref={cardsListRef}
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              pr: 0.5,
            }}
          >
            {shouldVirtualizeCards ? (
              <Box
                sx={{
                  height: `${cardRowVirtualizer.getTotalSize()}px`,
                  position: 'relative',
                  width: '100%',
                }}
              >
                {displayedVirtualCardRows.map((virtualRow) => {
                  const card = sortedCardSetCards[virtualRow.index];
                  if (!card) {
                    return null;
                  }

                  return (
                    <Box
                      data-index={virtualRow.index}
                      key={card.id}
                      sx={{
                        left: 0,
                        pb: 1.25,
                        position: 'absolute',
                        top: 0,
                        transform: `translateY(${virtualRow.start}px)`,
                        width: '100%',
                      }}
                    >
                      {renderCardRow(card)}
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Stack spacing={1.25}>
                {sortedCardSetCards.map((card) => renderCardRow(card))}
              </Stack>
            )}
          </Box>
        )}
      </Stack>
      </Paper>
      <Dialog
        aria-labelledby={cancelEditDialogTitleId}
        data-test={`card_set_detail__cancel_edit_dialog__${selectedCardSet.id}`}
        open={isCancelEditDialogOpen}
        onClose={() => setIsCancelEditDialogOpen(false)}
      >
        <DialogTitle
          data-test={`card_set_detail__cancel_edit_dialog_title__${selectedCardSet.id}`}
          id={cancelEditDialogTitleId}
          sx={{ fontWeight: 850 }}
        >
          {t(interfaceLanguage, 'cancelCardSetEditTitle')}
        </DialogTitle>
        <DialogContent
          data-test={`card_set_detail__cancel_edit_dialog_body__${selectedCardSet.id}`}
        >
          <Typography>
            {t(interfaceLanguage, 'cancelCardSetEditBody')}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setIsCancelEditDialogOpen(false)}>
            {t(interfaceLanguage, 'cancel')}
          </Button>
          <Button
            data-test={`card_set_detail__confirm_cancel_edit_button__${selectedCardSet.id}`}
            onClick={discardEditedCards}
            variant="contained"
          >
            {t(interfaceLanguage, 'confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function createCardSetId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `card-set-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
  const worldId = useSelector((state: RootState) =>
    resolveWorldId(state.app.worldId),
  );
  const worldResultColors = getWorldResultColors(worldId);

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
                      ? worldResultColors.correct.soft
                      : worldResultColors.incorrect.soft,
                    border: '1px solid',
                    borderColor: result.isCorrect
                      ? worldResultColors.correct.border
                      : worldResultColors.incorrect.border,
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

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function getCardDetailStatsColors(
  worldId: ReturnType<typeof resolveWorldId>,
): WorldResultColors {
  if (worldId === 'football') {
    return {
      correct: {
        border: '#58b947',
        main: '#279a36',
        soft: '#e1f6d7',
        text: '#163f1c',
      },
      incorrect: {
        border: '#e04435',
        main: '#c60b1e',
        soft: '#fee5d5',
        text: '#5a1118',
      },
    };
  }

  return {
    correct: {
      border: '#8fbd67',
      main: '#5d9a48',
      soft: '#edf8e4',
      text: '#24451c',
    },
    incorrect: {
      border: '#e28da0',
      main: '#d86b7c',
      soft: '#fff0f3',
      text: '#6a2130',
    },
  };
}

const recentCardStatsTooltipStyles = {
  bgcolor: '#ffffff',
  border: '1px solid rgba(32, 48, 21, 0.14)',
  boxShadow: '0 12px 28px rgba(32, 48, 21, 0.14)',
  color: '#203015',
  p: 1.25,
};
