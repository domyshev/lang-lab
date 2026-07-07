import { useMemo, useState } from 'react';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  Box,
  ButtonBase,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { LanguageCard } from '../domain/cards';
import { ALL_CARDS_CARD_SET_ID, CardSet } from '../domain/cardSets';
import { formatCardCount, t } from '../domain/i18n';
import { RootState } from '../store/store';

type CardSetLibraryItem = {
  cardCount: number;
  cardIds: string[];
  id: string;
  isAllCards?: boolean;
  name: string;
};

export function CardSetLibraryPicker({
  cards,
  cardSets,
  interfaceLanguage,
  onSelect,
  selectedCardSetId,
}: {
  cards: LanguageCard[];
  cardSets: CardSet[];
  interfaceLanguage: RootState['app']['interfaceLanguage'];
  onSelect: (cardSetId: string) => void;
  selectedCardSetId: string;
}) {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const items = useMemo<CardSetLibraryItem[]>(
    () => [
      {
        cardCount: cards.length,
        cardIds: cards.map((card) => card.id),
        id: ALL_CARDS_CARD_SET_ID,
        isAllCards: true,
        name: t(interfaceLanguage, 'allCards'),
      },
      ...cardSets.map((cardSet) => ({
        cardCount: cardSet.cardIds.length,
        cardIds: cardSet.cardIds,
        id: cardSet.id,
        name: cardSet.name,
      })),
    ],
    [cards, cardSets, interfaceLanguage],
  );
  const selectedItem =
    items.find((item) => item.id === selectedCardSetId) ?? null;
  const featuredItems = getFeaturedItems(items, selectedItem);
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredItems = normalizedSearch
    ? items.filter((item) =>
        cardSetMatchesSearch({
          cards,
          item,
          normalizedSearch,
        }),
      )
    : items;

  const handleSelect = (cardSetId: string) => {
    onSelect(cardSetId);
    setIsLibraryOpen(false);
    setSearchQuery('');
  };

  return (
    <Box
      data-test="card_set_library__panel"
      sx={{
        border: '1px solid rgba(32, 48, 21, 0.14)',
        borderRadius: 2,
        bgcolor: 'rgba(255, 255, 255, 0.72)',
        boxShadow: '0 12px 28px rgba(32, 48, 21, 0.08)',
        p: { xs: 1.5, sm: 2 },
      }}
    >
      <Stack spacing={1.5}>
        <Stack
          direction="row"
          spacing={1.25}
          sx={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              data-test="card_set_library__title"
              sx={{ color: '#203015', fontSize: 18, fontWeight: 900 }}
            >
              {t(interfaceLanguage, 'cardSetLibrary')}
            </Typography>
            {selectedItem ? (
              <Typography
                data-test="card_set_library__selected_name"
                sx={{ color: 'text.secondary', fontSize: 14, mt: 0.25 }}
              >
                {selectedItem.name}
              </Typography>
            ) : (
              <Typography
                data-test="card_set_library__placeholder"
                sx={{ color: 'text.secondary', fontSize: 14, mt: 0.25 }}
              >
                {t(interfaceLanguage, 'chooseCardSetPlaceholder')}
              </Typography>
            )}
          </Box>
          <IconButton
            aria-label={t(interfaceLanguage, 'openCardSetLibrary')}
            data-test="card_set_library__open_button"
            onClick={() => setIsLibraryOpen(true)}
            sx={{
              bgcolor: '#fff3c9',
              border: '1px solid rgba(131, 88, 17, 0.18)',
              color: '#6f4bd8',
              '&:hover': { bgcolor: '#ffe8a3' },
            }}
          >
            <SearchRoundedIcon data-test="card_set_library__open_search_icon" />
          </IconButton>
        </Stack>

        <Stack
          data-test="card_set_library__chips"
          direction="row"
          spacing={1}
          sx={{ flexWrap: 'wrap' }}
          useFlexGap
        >
          {featuredItems.map((item) => (
            <CardSetLibraryChip
              interfaceLanguage={interfaceLanguage}
              item={item}
              key={item.id}
              onSelect={() => handleSelect(item.id)}
              selected={item.id === selectedCardSetId}
            />
          ))}
        </Stack>
      </Stack>

      <Dialog
        data-test="card_set_library_dialog__root"
        fullWidth
        maxWidth="md"
        onClose={() => setIsLibraryOpen(false)}
        open={isLibraryOpen}
      >
        <DialogTitle
          data-test="card_set_library_dialog__title"
          sx={{ fontWeight: 900, pb: 1 }}
        >
          {t(interfaceLanguage, 'cardSetLibraryDialogTitle')}
        </DialogTitle>
        <DialogContent
          data-test="card_set_library_dialog__content"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'min(72vh, 720px)',
            overflow: 'hidden',
            pt: 0.5,
          }}
        >
          <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
            <Box
              data-test="card_set_library_dialog__search_area"
              sx={{ flexShrink: 0, pt: '10px' }}
            >
              <TextField
                fullWidth
                label={t(interfaceLanguage, 'searchCardSetLibrary')}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                slotProps={{
                  htmlInput: {
                    'data-test': 'card_set_library_dialog__search_input',
                  },
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Box>
            <Box
              data-test="card_set_library_dialog__items"
              sx={{
                display: 'grid',
                gap: 1.25,
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                },
                minHeight: 0,
                overflowY: 'auto',
                pr: 0.5,
              }}
            >
              {filteredItems.map((item) => (
                <CardSetLibraryChip
                  dialogMode
                  interfaceLanguage={interfaceLanguage}
                  item={item}
                  key={item.id}
                  onSelect={() => handleSelect(item.id)}
                  selected={item.id === selectedCardSetId}
                />
              ))}
            </Box>
            {filteredItems.length === 0 && (
              <Typography
                data-test="card_set_library_dialog__empty"
                sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}
              >
                {t(interfaceLanguage, 'cardSetLibraryNoResults')}
              </Typography>
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

function CardSetLibraryChip({
  dialogMode = false,
  interfaceLanguage,
  item,
  onSelect,
  selected,
}: {
  dialogMode?: boolean;
  interfaceLanguage: RootState['app']['interfaceLanguage'];
  item: CardSetLibraryItem;
  onSelect: () => void;
  selected: boolean;
}) {
  const gradient = getCardSetGradient(item.id, item.isAllCards);
  const dataTestPrefix = dialogMode
    ? 'card_set_library_dialog__item'
    : 'card_set_library__chip_select';
  const ariaPrefix = dialogMode
    ? t(interfaceLanguage, 'selectCardSetLibraryItem')
    : t(interfaceLanguage, 'cardSetLabel');

  return (
    <ButtonBase
      aria-label={`${ariaPrefix}: ${item.name}`}
      data-test={`${dataTestPrefix}__${item.id}`}
      onClick={onSelect}
      sx={{
        alignItems: 'stretch',
        border: selected
          ? '2px solid rgba(111, 75, 216, 0.88)'
          : '1px solid rgba(32, 48, 21, 0.14)',
        borderRadius: 3,
        boxShadow: selected
          ? '0 14px 30px rgba(111, 75, 216, 0.22)'
          : '0 10px 22px rgba(32, 48, 21, 0.10)',
        color: '#203015',
        display: 'flex',
        minHeight: dialogMode ? 118 : 86,
        minWidth: dialogMode ? 0 : { xs: '100%', sm: 210 },
        overflow: 'hidden',
        position: 'relative',
        textAlign: 'left',
        width: dialogMode ? '100%' : 'auto',
      }}
    >
      <Box
        aria-hidden="true"
        data-test={`${dataTestPrefix}_background__${item.id}`}
        sx={{
          background: gradient,
          inset: 0,
          position: 'absolute',
        }}
      />
      <Box
        aria-hidden="true"
        sx={{
          background:
            'radial-gradient(circle at 18% 28%, rgba(255,255,255,0.48) 0 14%, transparent 15%), linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.54))',
          inset: 0,
          position: 'absolute',
        }}
      />
      <Stack
        spacing={1}
        sx={{
          minWidth: 0,
          p: 1.35,
          position: 'relative',
          width: '100%',
          zIndex: 1,
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography
            data-test={`${dataTestPrefix}_name__${item.id}`}
            noWrap
            sx={{ flex: 1, fontSize: 18, fontWeight: 950, minWidth: 0 }}
          >
            {item.name}
          </Typography>
          {selected && (
            <CheckCircleRoundedIcon
              data-test={`${dataTestPrefix}_selected_icon__${item.id}`}
              sx={{ color: '#5e3fc0', flex: '0 0 auto' }}
            />
          )}
        </Stack>
        <Chip
          data-test={`${dataTestPrefix}_count__${item.id}`}
          label={formatCardCount(interfaceLanguage, item.cardCount)}
          size="small"
          sx={{
            alignSelf: 'flex-start',
            bgcolor: 'rgba(255, 255, 255, 0.70)',
            border: '1px solid rgba(32, 48, 21, 0.16)',
            fontWeight: 800,
          }}
        />
      </Stack>
    </ButtonBase>
  );
}

function cardSetMatchesSearch({
  cards,
  item,
  normalizedSearch,
}: {
  cards: LanguageCard[];
  item: CardSetLibraryItem;
  normalizedSearch: string;
}) {
  if (item.name.toLowerCase().includes(normalizedSearch)) {
    return true;
  }

  const cardIdSet = new Set(item.cardIds);
  return cards
    .filter((card) => cardIdSet.has(card.id))
    .some((card) =>
      Object.values(card.translations).some((value) =>
        value?.toLowerCase().includes(normalizedSearch),
      ),
    );
}

function getFeaturedItems(
  items: CardSetLibraryItem[],
  selectedItem: CardSetLibraryItem | null,
): CardSetLibraryItem[] {
  const allCardsItem = items[0];
  if (!allCardsItem || !selectedItem || selectedItem.isAllCards) {
    return items.slice(0, 4);
  }

  return [
    allCardsItem,
    selectedItem,
    ...items
      .slice(1)
      .filter((item) => item.id !== selectedItem.id),
  ].slice(0, 4);
}

function getCardSetGradient(id: string, isAllCards?: boolean) {
  if (isAllCards) {
    return 'linear-gradient(135deg, #f9f871 0%, #9be667 42%, #61d4ff 100%)';
  }

  const gradients = [
    'linear-gradient(135deg, #ffd166 0%, #ff8fa3 48%, #8ec5ff 100%)',
    'linear-gradient(135deg, #baff7a 0%, #61e8c8 48%, #73a7ff 100%)',
    'linear-gradient(135deg, #ffc6ff 0%, #bdb2ff 46%, #a0c4ff 100%)',
    'linear-gradient(135deg, #fdff8f 0%, #ffb703 44%, #fb7185 100%)',
    'linear-gradient(135deg, #9bf6ff 0%, #7bdff2 45%, #c77dff 100%)',
    'linear-gradient(135deg, #caffbf 0%, #ffd6a5 48%, #ffadad 100%)',
  ];
  const hash = Array.from(id).reduce(
    (value, char) => value + char.charCodeAt(0),
    0,
  );
  return gradients[hash % gradients.length];
}
