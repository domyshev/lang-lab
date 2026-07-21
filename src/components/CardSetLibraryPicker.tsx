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

import { useEffect, useMemo, useRef, useState } from 'react';
import type { WheelEvent } from 'react';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
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
import { LanguageCard, isCardKnownForTarget } from '../domain/cards';
import {
  ALL_CARDS_CARD_SET_ID,
  CardSet,
  getCardSetName,
} from '../domain/cardSets';
import { formatCardCount, t } from '../domain/i18n';
import { SupportedLanguage } from '../domain/languages';
import {
  getPaletteForCardSet,
  getWorldAccent,
  resolveWorldId,
  type WorldId,
} from '../domain/worlds';
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
  onOpenAiAssistant,
  onSelect,
  selectedCardSetId,
  targetLanguage,
  worldId = 'football',
}: {
  cards: LanguageCard[];
  cardSets: CardSet[];
  interfaceLanguage: RootState['app']['interfaceLanguage'];
  onOpenAiAssistant: () => void;
  onSelect: (cardSetId: string) => void;
  selectedCardSetId: string;
  targetLanguage: SupportedLanguage;
  worldId?: WorldId;
}) {
  const wheelDeltaAccumulator = useRef(0);
  const resolvedWorldId = resolveWorldId(worldId);
  const worldAccent = getWorldAccent(resolvedWorldId);
  const items = useMemo<CardSetLibraryItem[]>(() => {
    const cardById = new Map(cards.map((card) => [card.id, card]));
    const countPlayableCards = (cardIds: string[]) =>
      cardIds.reduce((count, cardId) => {
        const card = cardById.get(cardId);
        return card && !isCardKnownForTarget(card, targetLanguage)
          ? count + 1
          : count;
      }, 0);
    const allCardIds = cards.map((card) => card.id);

    return [
      {
        cardCount: countPlayableCards(allCardIds),
        cardIds: allCardIds,
        id: ALL_CARDS_CARD_SET_ID,
        isAllCards: true,
        name: t(targetLanguage, 'allCards'),
      },
      ...cardSets.map((cardSet) => ({
        cardCount: countPlayableCards(cardSet.cardIds),
        cardIds: cardSet.cardIds,
        id: cardSet.id,
        name: getCardSetName(cardSet, targetLanguage),
      })),
    ];
  }, [cards, cardSets, targetLanguage]);
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
            <Stack
              data-test="card_set_library__title_row"
              direction="row"
              style={{ gap: '10px' }}
              sx={{ alignItems: 'center' }}
            >
              <Typography
                data-test="card_set_library__title"
                sx={{ color: '#203015', fontSize: 18, fontWeight: 900 }}
              >
                {t(interfaceLanguage, 'cardSetLibrary')}
              </Typography>
              <Tooltip title={t(interfaceLanguage, 'openAiAssistant')}>
                <IconButton
                  aria-label={t(interfaceLanguage, 'openAiAssistant')}
                  data-test="card_set_library__ai_assistant_button"
                  onClick={onOpenAiAssistant}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(24, 119, 201, 0.10)',
                    color: worldAccent.main,
                    flexShrink: 0,
                    '&:hover': { bgcolor: 'rgba(24, 119, 201, 0.18)' },
                  }}
                >
                  <AutoFixHighIcon
                    data-test="card_set_library__ai_assistant_icon"
                    fontSize="small"
                  />
                </IconButton>
              </Tooltip>
            </Stack>
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
              color: worldAccent.main,
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
            sx={getCarouselButtonSx(worldAccent)}
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
                worldId={resolvedWorldId}
              />
            ))}
          </Box>
          <IconButton
            aria-label={t(interfaceLanguage, 'nextCardSets')}
            data-test="card_set_library__next_button"
            disabled={!canPageForward}
            onClick={() => pageFeaturedItems(1)}
            sx={getCarouselButtonSx(worldAccent)}
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
                  worldId={resolvedWorldId}
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
  worldId,
}: {
  dialogMode?: boolean;
  interfaceLanguage: RootState['app']['interfaceLanguage'];
  item: CardSetLibraryItem;
  onSelect: () => void;
  selected: boolean;
  worldId: WorldId;
}) {
  const worldAccent = getWorldAccent(worldId);
  const palette = getPaletteForCardSet(item.id, worldId, {
    isAllCards: item.isAllCards,
  });
  const dataTestPrefix = dialogMode
    ? 'card_set_library_dialog__item'
    : 'card_set_library__chip_select';
  const ariaPrefix = dialogMode
    ? t(interfaceLanguage, 'selectCardSetLibraryItem')
    : t(interfaceLanguage, 'cardSetLabel');

  return (
    <ButtonBase
      aria-label={`${ariaPrefix}: ${item.name}`}
      data-football-country={palette.countryKey}
      data-test={`${dataTestPrefix}__${item.id}`}
      onClick={onSelect}
      style={
        selected
          ? {
              boxShadow:
                `0 0 0 4px ${worldAccent.dark}, 0 0 0 7px #fffdf4, 0 18px 36px rgba(18, 60, 105, 0.30)`,
            }
          : undefined
      }
      sx={{
        alignItems: 'stretch',
        border: selected
          ? '2px solid #fffdf4'
          : '1px solid rgba(32, 48, 21, 0.14)',
        borderRadius: 3,
        boxShadow: selected
          ? `0 0 0 4px ${worldAccent.dark}, 0 0 0 7px #fffdf4, 0 18px 36px rgba(18, 60, 105, 0.30)`
          : '0 10px 22px rgba(32, 48, 21, 0.10)',
        color: palette.foreground,
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
          background: palette.gradient,
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
              sx={{
                bgcolor: '#fffdf4',
                border: `2px solid ${worldAccent.dark}`,
                borderRadius: '999px',
                boxShadow: '0 8px 18px rgba(18, 60, 105, 0.24)',
                color: worldAccent.dark,
                flex: '0 0 auto',
                fontSize: 34,
              }}
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

function getCenteredStartIndex(index: number, itemCount: number) {
  if (index < 0) {
    return 0;
  }

  const maxStartIndex = Math.max(0, itemCount - featuredCardSetLimit);
  return Math.min(Math.max(0, index - 1), maxStartIndex);
}

function getCarouselButtonSx(worldAccent: ReturnType<typeof getWorldAccent>) {
  return {
    alignSelf: 'stretch',
    bgcolor: 'transparent',
    border: '0px solid transparent',
    borderRadius: 2,
    color: worldAccent.main,
    justifyContent: 'center',
    minWidth: 0,
    px: 0,
    width: { xs: 18, sm: 12 },
    '&:hover': {
      bgcolor: 'transparent',
      color: worldAccent.dark,
    },
    '&.Mui-disabled': {
      bgcolor: 'transparent',
      borderColor: 'transparent',
      color: 'rgba(32, 48, 21, 0.22)',
    },
  };
}
