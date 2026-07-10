import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CardSetLibraryPicker } from '../CardSetLibraryPicker';
import type { LanguageCard } from '../../domain/cards';
import type { CardSet } from '../../domain/cardSets';

const now = '2026-07-03T12:00:00.000Z';

const cards: LanguageCard[] = [
  makeCard('card-love', 'love'),
  makeCard('card-family', 'family'),
  makeCard('card-work', 'work'),
  makeCard('card-travel', 'travel'),
];

const cardSets: CardSet[] = [
  makeCardSet('love-set', 'Любовь', ['card-love']),
  makeCardSet('family-set', 'Семья', ['card-family']),
  makeCardSet('work-set', 'Работа', ['card-work']),
  makeCardSet('travel-set', 'Путешествия', ['card-travel']),
];

describe('CardSetLibraryPicker', () => {
  it('centers an already selected card set between its neighbors', () => {
    render(
      <CardSetLibraryPicker
        cards={cards}
        cardSets={cardSets}
        interfaceLanguage="ru"
        selectedCardSetId="work-set"
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByTestId('card_set_library__selected_name')).toHaveTextContent(
      'Работа',
    );
    expect(
      within(screen.getByTestId('card_set_library__chips'))
        .getAllByRole('button')
        .map((button) => button.getAttribute('data-test')),
    ).toEqual([
      'card_set_library__chip_select__family-set',
      'card_set_library__chip_select__work-set',
      'card_set_library__chip_select__travel-set',
    ]);
  });

  it('re-anchors the visible window when selection changes after manual paging', () => {
    const { rerender } = render(
      <CardSetLibraryPicker
        cards={cards}
        cardSets={cardSets}
        interfaceLanguage="ru"
        selectedCardSetId="all-cards"
        onSelect={vi.fn()}
      />,
    );

    fireEvent.wheel(screen.getByTestId('card_set_library__chips'), { deltaY: 120 });

    expect(screen.getByTestId('card_set_library__carousel')).toHaveAttribute(
      'data-featured-start-index',
      '1',
    );

    rerender(
      <CardSetLibraryPicker
        cards={cards}
        cardSets={cardSets}
        interfaceLanguage="ru"
        selectedCardSetId="work-set"
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByTestId('card_set_library__carousel')).toHaveAttribute(
      'data-featured-start-index',
      '2',
    );
    expect(
      within(screen.getByTestId('card_set_library__chips'))
        .getAllByRole('button')
        .map((button) => button.getAttribute('data-test')),
    ).toEqual([
      'card_set_library__chip_select__family-set',
      'card_set_library__chip_select__work-set',
      'card_set_library__chip_select__travel-set',
    ]);
  });

  it('renders carousel paging controls as centered bare arrows', () => {
    render(
      <CardSetLibraryPicker
        cards={cards}
        cardSets={cardSets}
        interfaceLanguage="ru"
        selectedCardSetId="all-cards"
        onSelect={vi.fn()}
      />,
    );

    const previousStyles = getComputedStyle(
      screen.getByTestId('card_set_library__previous_button'),
    );
    const nextStyles = getComputedStyle(
      screen.getByTestId('card_set_library__next_button'),
    );

    expect(previousStyles.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(previousStyles.borderTopWidth).toBe('0px');
    expect(previousStyles.justifyContent).toBe('center');
    expect(nextStyles.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(nextStyles.borderTopWidth).toBe('0px');
    expect(nextStyles.justifyContent).toBe('center');
  });

  it('shows the full card set name in a tooltip for clipped chip titles', async () => {
    const user = userEvent.setup();
    const longName = 'Глаголы действия для ежедневной тренировки';
    render(
      <CardSetLibraryPicker
        cards={cards}
        cardSets={[makeCardSet('verbs-set', longName, ['card-work'])]}
        interfaceLanguage="ru"
        selectedCardSetId="verbs-set"
        onSelect={vi.fn()}
      />,
    );

    await user.hover(
      screen.getByTestId('card_set_library__chip_select_name__verbs-set'),
    );

    expect(await screen.findByRole('tooltip')).toHaveTextContent(longName);
  });
});

function makeCard(id: string, en: string): LanguageCard {
  return {
    id,
    translations: {
      en,
      ru: `${en} ru`,
      es: `${en} es`,
    },
    createdAt: now,
    updatedAt: now,
  };
}

function makeCardSet(id: string, name: string, cardIds: string[]): CardSet {
  return {
    id,
    name,
    cardIds,
    createdAt: now,
    updatedAt: now,
  };
}
