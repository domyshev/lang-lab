import { useMemo, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import ArchiveIcon from '@mui/icons-material/Archive';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import {
  ALL_CARDS_CARD_SET_ID,
  getCardSetName,
  getCardSetSearchValues,
  isArchivedCardSet,
  normalizeCardSetName,
} from '../domain/cardSets';
import { isCardKnownForTarget } from '../domain/cards';
import { formatCardCount, formatCardSetCount, t } from '../domain/i18n';
import {
  addCardSet,
  archiveCardSet,
  copyArchivedCardSet,
  selectCardSet,
} from '../store/cardSetsSlice';
import { AppDispatch, RootState } from '../store/store';
import { forestLilacAccent, resolveWorldId, type WorldId } from '../domain/worlds';

export function CardSetListView({
  onCardSetCreated,
}: {
  onCardSetCreated?: (cardSetId: string) => void;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const cards = useSelector((state: RootState) => state.cards.cards);
  const cardSets = useSelector((state: RootState) => state.cardSets.cardSets);
  const selectedCardSetId = useSelector(
    (state: RootState) => state.cardSets.selectedCardSetId,
  );
  const interfaceLanguage = useSelector(
    (state: RootState) => state.app.interfaceLanguage,
  );
  const targetLanguage = useSelector(
    (state: RootState) => state.app.targetLanguage,
  );
  const worldId = useSelector((state: RootState) =>
    resolveWorldId(state.app.worldId),
  );
  const cardById = useMemo(
    () => new Map(cards.map((card) => [card.id, card])),
    [cards],
  );
  const countPlayableCards = (cardIds: string[]) =>
    cardIds.reduce((count, cardId) => {
      const card = cardById.get(cardId);
      return card && !isCardKnownForTarget(card, targetLanguage)
        ? count + 1
        : count;
    }, 0);
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [cardSetSearchQuery, setCardSetSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const normalizedCardSetSearch = cardSetSearchQuery
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase();
  const visibleCardSets = cardSets.filter((cardSet) => {
    if (showArchived !== isArchivedCardSet(cardSet)) {
      return false;
    }
    if (!normalizedCardSetSearch) {
      return true;
    }
    return getCardSetSearchValues(cardSet).some((value) =>
      value.includes(normalizedCardSetSearch),
    );
  });
  const allCardsName = t(targetLanguage, 'allCards');
  const showAllCardsTile =
    !showArchived &&
    (!normalizedCardSetSearch ||
      normalizeCardSetName(allCardsName).includes(normalizedCardSetSearch));

  const createCardSet = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    const now = new Date().toISOString();
    const cardSetId = createCardSetId();
    dispatch(
      addCardSet({
        id: cardSetId,
        name: trimmedName,
        cardIds: [],
        createdAt: now,
        updatedAt: now,
      }),
    );
    onCardSetCreated?.(cardSetId);
    setName('');
    setIsCreating(false);
  };

  return (
    <Paper
      data-test="card_set_list__panel"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 118px)',
        minHeight: 0,
        p: { xs: 2, md: 3 },
        '@media (max-width: 899.95px)': {
          maxHeight: 'none',
        },
      }}
    >
      <Stack
        data-test="card_set_list__content"
        spacing={2.5}
        sx={{ flex: 1, minHeight: 0 }}
      >
        <Stack
          data-test="card_set_list__header"
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
        >
          <Box data-test="card_set_list__header_text">
            <Typography
              data-test="card_set_list__title"
              variant="h5"
              component="h2"
              sx={{ fontWeight: 800 }}
            >
              {t(interfaceLanguage, 'cards')}
            </Typography>
            <Typography
              color="text.secondary"
              data-test="card_set_list__card_set_count"
              sx={{ mt: 0.5 }}
            >
              {formatCardSetCount(
                interfaceLanguage,
                visibleCardSets.length + (showAllCardsTile ? 1 : 0),
              )}
            </Typography>
          </Box>
          <Button
            data-test="card_set_list__add_button"
            startIcon={<AddIcon />}
            variant="contained"
            onClick={() => setIsCreating((value) => !value)}
            sx={getCardSetListActionSx(worldId)}
          >
            {t(interfaceLanguage, 'add')}
          </Button>
        </Stack>

        {isCreating && (
          <Stack
            data-test="card_set_list__create_form"
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ width: '100%' }}
          >
            <TextField
              data-test="card_set_list__create_name_input"
              label={t(interfaceLanguage, 'newCardSet')}
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  createCardSet();
                }
              }}
              fullWidth
            />
            <Button
              data-test="card_set_list__create_submit_button"
              variant="contained"
              onClick={createCardSet}
              disabled={!name.trim()}
              sx={{ minWidth: 150, ...getCardSetListActionSx(worldId) }}
            >
              {t(interfaceLanguage, 'create')}
            </Button>
          </Stack>
        )}

        <Stack data-test="card_set_list__filters" spacing={1}>
          <TextField
            data-test="card_set_list__search_input"
            label={t(interfaceLanguage, 'searchCardSets')}
            size="small"
            value={cardSetSearchQuery}
            onChange={(event) => setCardSetSearchQuery(event.target.value)}
            slotProps={{
              input: {
                endAdornment: cardSetSearchQuery ? (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={t(interfaceLanguage, 'clearCardSetSearch')}
                      data-test="card_set_list__search_clear_button"
                      edge="end"
                      onClick={() => setCardSetSearchQuery('')}
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
          <FormControlLabel
            control={
              <Checkbox
                data-test="card_set_list__archived_checkbox"
                checked={showArchived}
                onChange={(event) => setShowArchived(event.target.checked)}
              />
            }
            label={t(interfaceLanguage, 'showArchivedCardSets')}
          />
        </Stack>

        <Stack
          data-test="card_set_list__tiles"
          spacing={1.25}
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            pr: 0.5,
          }}
        >
          {showAllCardsTile && (
            <CardSetTile
              id={ALL_CARDS_CARD_SET_ID}
              name={allCardsName}
              cardCount={countPlayableCards(cards.map((card) => card.id))}
              interfaceLanguage={interfaceLanguage}
              worldId={worldId}
              selected={
                selectedCardSetId === ALL_CARDS_CARD_SET_ID || !selectedCardSetId
              }
              onSelect={() => dispatch(selectCardSet(ALL_CARDS_CARD_SET_ID))}
            />
          )}

          {visibleCardSets.map((cardSet) => (
            <CardSetTile
              id={cardSet.id}
              key={cardSet.id}
              name={getCardSetName(cardSet, targetLanguage)}
              cardCount={countPlayableCards(cardSet.cardIds)}
              interfaceLanguage={interfaceLanguage}
              worldId={worldId}
              selected={cardSet.id === selectedCardSetId}
              onArchive={
                isArchivedCardSet(cardSet)
                  ? undefined
                  : () =>
                      dispatch(
                        archiveCardSet({
                          cardSetId: cardSet.id,
                          archivedAt: new Date().toISOString(),
                        }),
                      )
              }
              onCopyArchived={
                isArchivedCardSet(cardSet)
                  ? () =>
                      dispatch(
                        copyArchivedCardSet({
                          sourceCardSetId: cardSet.id,
                          newCardSetId: createCardSetId(),
                          now: new Date().toISOString(),
                        }),
                      )
                  : undefined
              }
              onSelect={() => dispatch(selectCardSet(cardSet.id))}
            />
          ))}
        </Stack>
      </Stack>
    </Paper>
  );
}

function CardSetTile({
  cardCount,
  id,
  interfaceLanguage,
  name,
  onArchive,
  onCopyArchived,
  onSelect,
  selected,
  worldId,
}: {
  cardCount: number;
  id: string;
  interfaceLanguage: RootState['app']['interfaceLanguage'];
  name: string;
  onArchive?: () => void;
  onCopyArchived?: () => void;
  onSelect: () => void;
  selected: boolean;
  worldId: WorldId;
}) {
  const selectedBorderColor =
    worldId === 'forest' ? forestLilacAccent.main : 'primary.main';

  return (
    <Paper
      data-test={`card_set_list__tile__${id}`}
      variant="outlined"
      sx={{
        borderColor: selected ? selectedBorderColor : 'divider',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      <Stack direction="row" alignItems="center">
        <Box
          data-test={`card_set_list__tile_select_area__${id}`}
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
          <Typography
            data-test={`card_set_list__tile_name__${id}`}
            fontWeight={800}
            noWrap
          >
            {name}
          </Typography>
          <Chip
            data-test={`card_set_list__tile_card_count__${id}`}
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
              data-test={`card_set_list__tile_archive_button__${id}`}
              onClick={onArchive}
              sx={{ mx: 1 }}
            >
              <ArchiveIcon />
            </IconButton>
          </Tooltip>
        )}

        {onCopyArchived && (
          <Tooltip title={t(interfaceLanguage, 'createActiveCopy')}>
            <IconButton
              aria-label={`${t(interfaceLanguage, 'createActiveCopy')}: ${name}`}
              data-test={`card_set_list__tile_copy_button__${id}`}
              onClick={onCopyArchived}
              sx={{ mx: 1 }}
            >
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Paper>
  );
}

function getCardSetListActionSx(worldId: WorldId) {
  if (worldId !== 'forest') {
    return undefined;
  }

  return {
    background:
      'linear-gradient(180deg, #ffffff 0%, #e9ffd1 22%, #9ed54c 58%, #67a13f 100%)',
    backgroundImage:
      'linear-gradient(180deg, #ffffff 0%, #e9ffd1 22%, #9ed54c 58%, #67a13f 100%)',
    border: '1px solid rgba(125, 174, 72, 0.38)',
    borderTopColor: 'rgba(255, 255, 255, 0.92)',
    boxShadow:
      '0 10px 20px rgba(63, 91, 38, 0.16), inset 0 3px 0 rgba(255,255,255,0.94)',
    color: '#183813',
    fontWeight: 900,
    textTransform: 'none',
    '&:hover': {
      background:
        'linear-gradient(180deg, #ffffff 0%, #f0ffd8 20%, #a9dc5c 56%, #70ab45 100%)',
      backgroundImage:
        'linear-gradient(180deg, #ffffff 0%, #f0ffd8 20%, #a9dc5c 56%, #70ab45 100%)',
      borderTopColor: 'rgba(255, 255, 255, 0.96)',
      boxShadow:
        '0 12px 24px rgba(63, 91, 38, 0.2), inset 0 3px 0 rgba(255,255,255,0.96)',
    },
  };
}

function createCardSetId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `card-set-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
