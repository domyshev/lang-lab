import { useEffect, useMemo, useRef, useState } from 'react';
import type { WheelEvent } from 'react';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import KeyboardArrowLeftRoundedIcon from '@mui/icons-material/KeyboardArrowLeftRounded';
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded';
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
  Tooltip,
  Typography,
} from '@mui/material';
import { LanguageCard } from '../domain/cards';
import {
  ALL_CARDS_CARD_SET_ID,
  CardSet,
  getCardSetName,
} from '../domain/cardSets';
import { formatCardCount, t } from '../domain/i18n';
import { SupportedLanguage } from '../domain/languages';
import { RootState } from '../store/store';

const featuredCardSetLimit = 3;
const featuredWheelThreshold = 320;

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
  targetLanguage,
}: {
  cards: LanguageCard[];
  cardSets: CardSet[];
  interfaceLanguage: RootState['app']['interfaceLanguage'];
  onSelect: (cardSetId: string) => void;
  selectedCardSetId: string;
  targetLanguage: SupportedLanguage;
}) {
  const wheelDeltaAccumulator = useRef(0);
  const items = useMemo<CardSetLibraryItem[]>(
    () => [
      {
        cardCount: cards.length,
        cardIds: cards.map((card) => card.id),
        id: ALL_CARDS_CARD_SET_ID,
        isAllCards: true,
        name: t(targetLanguage, 'allCards'),
      },
      ...cardSets.map((cardSet) => ({
        cardCount: cardSet.cardIds.length,
        cardIds: cardSet.cardIds,
        id: cardSet.id,
        name: getCardSetName(cardSet, targetLanguage),
      })),
    ],
    [cards, cardSets, targetLanguage],
  );
  const selectedIndex = items.findIndex((item) => item.id === selectedCardSetId);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredStartIndex, setFeaturedStartIndex] = useState(() =>
    getCenteredStartIndex(selectedIndex, items.length),
  );
  const selectedItem =
    items.find((item) => item.id === selectedCardSetId) ?? null;
  const featuredItems = items.slice(
    featuredStartIndex,
    featuredStartIndex + featuredCardSetLimit,
  );
  const canPageBack = featuredStartIndex > 0;
  const canPageForward =
    featuredStartIndex + featuredCardSetLimit < items.length;
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

  useEffect(() => {
    setFeaturedStartIndex((currentIndex) =>
      Math.min(currentIndex, Math.max(0, items.length - featuredCardSetLimit)),
    );
  }, [items.length]);

  useEffect(() => {
    setFeaturedStartIndex(getCenteredStartIndex(selectedIndex, items.length));
  }, [items.length, selectedCardSetId, selectedIndex]);

  const handleSelect = (cardSetId: string, source: 'featured' | 'dialog') => {
    if (source === 'dialog') {
      const nextIndex = items.findIndex((item) => item.id === cardSetId);
      setFeaturedStartIndex(getCenteredStartIndex(nextIndex, items.length));
    }
    onSelect(cardSetId);
    setIsLibraryOpen(false);
    setSearchQuery('');
  };

  const pageFeaturedItems = (direction: -1 | 1) => {
    setFeaturedStartIndex((currentIndex) => {
      const nextIndex = currentIndex + direction;
      if (direction < 0) {
        return Math.max(0, nextIndex);
      }

      if (currentIndex + featuredCardSetLimit >= items.length) {
        return currentIndex;
      }

      return nextIndex;
    });
  };

  const handleFeaturedWheel = (event: WheelEvent<HTMLDivElement>) => {
    const direction = Math.abs(event.deltaX) > Math.abs(event.deltaY)
      ? event.deltaX
      : event.deltaY;
    if (direction === 0) {
      return;
    }

    const canMove = direction > 0 ? canPageForward : canPageBack;
    if (!canMove) {
      wheelDeltaAccumulator.current = 0;
      return;
    }

    event.preventDefault();
    wheelDeltaAccumulator.current =
      Math.sign(wheelDeltaAccumulator.current) === Math.sign(direction)
        ? wheelDeltaAccumulator.current + direction
        : direction;

    if (Math.abs(wheelDeltaAccumulator.current) < featuredWheelThreshold) {
      return;
    }

    pageFeaturedItems(direction > 0 ? 1 : -1);
    wheelDeltaAccumulator.current = 0;
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
          data-test="card_set_library__carousel"
          data-featured-start-index={featuredStartIndex}
          direction="row"
          spacing={0.75}
          sx={{ alignItems: 'stretch' }}
        >
          <IconButton
            aria-label={t(interfaceLanguage, 'previousCardSets')}
            data-test="card_set_library__previous_button"
            disabled={!canPageBack}
            onClick={() => pageFeaturedItems(-1)}
            sx={carouselButtonSx}
          >
            <KeyboardArrowLeftRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <Box
            data-test="card_set_library__chips"
            onWheel={handleFeaturedWheel}
            sx={{
              display: 'grid',
              flex: 1,
              gap: 1,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(3, minmax(0, 1fr))',
              },
              minWidth: 0,
            }}
          >
            {featuredItems.map((item) => (
              <CardSetLibraryChip
                interfaceLanguage={interfaceLanguage}
                item={item}
                key={item.id}
                onSelect={() => handleSelect(item.id, 'featured')}
                selected={item.id === selectedCardSetId}
              />
            ))}
          </Box>
          <IconButton
            aria-label={t(interfaceLanguage, 'nextCardSets')}
            data-test="card_set_library__next_button"
            disabled={!canPageForward}
            onClick={() => pageFeaturedItems(1)}
            sx={carouselButtonSx}
          >
            <KeyboardArrowRightRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
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
            height: 'min(72vh, 720px)',
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
                flex: 1,
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
                  onSelect={() => handleSelect(item.id, 'dialog')}
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
        minWidth: 0,
        overflow: 'hidden',
        position: 'relative',
        textAlign: 'left',
        width: '100%',
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
          <Tooltip
            arrow
            describeChild
            enterDelay={250}
            placement="top"
            slotProps={{
              arrow: {
                sx: {
                  color: '#ffffff',
                  '&::before': {
                    border: '1px solid rgba(32, 48, 21, 0.14)',
                  },
                },
              },
              tooltip: {
                sx: {
                  bgcolor: '#ffffff',
                  border: '1px solid rgba(32, 48, 21, 0.14)',
                  borderRadius: 1.5,
                  boxShadow: '0 12px 24px rgba(32, 48, 21, 0.16)',
                  color: '#203015',
                  fontSize: 14,
                  fontWeight: 800,
                  maxWidth: 320,
                  px: 1.25,
                  py: 0.9,
                },
              },
            }}
            title={item.name}
          >
            <Typography
              data-test={`${dataTestPrefix}_name__${item.id}`}
              noWrap
              sx={{ flex: 1, fontSize: 18, fontWeight: 950, minWidth: 0 }}
            >
              {item.name}
            </Typography>
          </Tooltip>
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

function getCenteredStartIndex(index: number, itemCount: number) {
  if (index < 0) {
    return 0;
  }

  const maxStartIndex = Math.max(0, itemCount - featuredCardSetLimit);
  return Math.min(Math.max(0, index - 1), maxStartIndex);
}

const carouselButtonSx = {
  alignSelf: 'stretch',
  bgcolor: 'transparent',
  border: '0px solid transparent',
  borderRadius: 2,
  color: '#6f4bd8',
  justifyContent: 'center',
  minWidth: 0,
  px: 0,
  width: { xs: 18, sm: 12 },
  '&:hover': {
    bgcolor: 'transparent',
    color: '#4d31aa',
  },
  '&.Mui-disabled': {
    bgcolor: 'transparent',
    borderColor: 'transparent',
    color: 'rgba(32, 48, 21, 0.22)',
  },
};
