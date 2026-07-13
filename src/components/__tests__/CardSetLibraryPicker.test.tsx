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
        targetLanguage="ru"
        selectedCardSetId="work-set"
        onOpenAiAssistant={vi.fn()}
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
        targetLanguage="ru"
        selectedCardSetId="all-cards"
        onOpenAiAssistant={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    fireEvent.wheel(screen.getByTestId('card_set_library__chips'), { deltaY: 120 });

    expect(screen.getByTestId('card_set_library__carousel')).toHaveAttribute(
      'data-featured-start-index',
      '0',
    );

    fireEvent.wheel(screen.getByTestId('card_set_library__chips'), { deltaY: 360 });

    expect(screen.getByTestId('card_set_library__carousel')).toHaveAttribute(
      'data-featured-start-index',
      '1',
    );

    rerender(
      <CardSetLibraryPicker
        cards={cards}
        cardSets={cardSets}
        interfaceLanguage="ru"
        targetLanguage="ru"
        selectedCardSetId="work-set"
        onOpenAiAssistant={vi.fn()}
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
        targetLanguage="ru"
        selectedCardSetId="all-cards"
        onOpenAiAssistant={vi.fn()}
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
        targetLanguage="ru"
        selectedCardSetId="verbs-set"
        onOpenAiAssistant={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    await user.hover(
      screen.getByTestId('card_set_library__chip_select_name__verbs-set'),
    );

    expect(await screen.findByRole('tooltip')).toHaveTextContent(longName);
  });

  it('uses target-language names for card sets independently from interface language', () => {
    render(
      <CardSetLibraryPicker
        cards={cards}
        cardSets={[
          makeCardSet('verbs-set', 'Глаголы действий', ['card-work'], {
            en: 'Action verbs',
            es: 'Verbos de accion',
            ru: 'Глаголы действий',
          }),
        ]}
        interfaceLanguage="ru"
        targetLanguage="en"
        selectedCardSetId="verbs-set"
        onOpenAiAssistant={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByTestId('card_set_library__selected_name')).toHaveTextContent(
      'Action verbs',
    );
    expect(
      screen.getByTestId('card_set_library__chip_select_name__verbs-set'),
    ).toHaveTextContent('Action verbs');
    expect(
      screen.getByTestId('card_set_library__chip_select_name__all-cards'),
    ).toHaveTextContent('All cards');
  });

  it('excludes cards marked as known for the target language from visible card counts', () => {
    render(
      <CardSetLibraryPicker
        cards={[
          makeCard('card-love', 'love', { knownTargetLanguages: ['ru'] }),
          makeCard('card-family', 'family'),
          makeCard('card-work', 'work'),
        ]}
        cardSets={[
          makeCardSet('known-set', 'Знаю', ['card-love']),
          makeCardSet('mixed-set', 'Смешанный', ['card-love', 'card-family']),
        ]}
        interfaceLanguage="ru"
        targetLanguage="ru"
        selectedCardSetId="all-cards"
        onOpenAiAssistant={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    expect(
      screen.getByTestId('card_set_library__chip_select_count__all-cards'),
    ).toHaveTextContent('2 карточки');
    expect(
      screen.getByTestId('card_set_library__chip_select_count__known-set'),
    ).toHaveTextContent('0 карточек');
    expect(
      screen.getByTestId('card_set_library__chip_select_count__mixed-set'),
    ).toHaveTextContent('1 карточка');
  });

  it('uses stadium-blue AI Assistant styling beside the title with an exact 10px gap', async () => {
    const user = userEvent.setup();
    const onOpenAiAssistant = vi.fn();
    render(
      <CardSetLibraryPicker
        cards={cards}
        cardSets={cardSets}
        interfaceLanguage="ru"
        targetLanguage="ru"
        selectedCardSetId="all-cards"
        onOpenAiAssistant={onOpenAiAssistant}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByTestId('card_set_library__title_row')).toHaveStyle({
      gap: '10px',
    });
    const wand = screen.getByTestId('card_set_library__ai_assistant_button');
    expect(wand).toHaveAttribute('aria-label', 'Открыть AI помощника');
    expect(getComputedStyle(wand).color).toBe('rgb(24, 119, 201)');
    expect(getComputedStyle(wand).color).not.toBe('rgb(111, 75, 216)');

    await user.hover(wand);
    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Открыть AI помощника',
    );

    await user.click(wand);
    expect(onOpenAiAssistant).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByTestId('card_set_library_dialog__root'),
    ).not.toBeInTheDocument();
  });

  it('assigns stable football country palettes to visible card set chips', () => {
    const { rerender } = render(
      <CardSetLibraryPicker
        cards={cards}
        cardSets={cardSets}
        interfaceLanguage="ru"
        targetLanguage="ru"
        selectedCardSetId="all-cards"
        onOpenAiAssistant={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByTestId('card_set_library__chip_select__all-cards')).toHaveAttribute(
      'data-football-country',
      'spain',
    );

    rerender(
      <CardSetLibraryPicker
        cards={cards}
        cardSets={cardSets}
        interfaceLanguage="ru"
        targetLanguage="ru"
        selectedCardSetId="work-set"
        onOpenAiAssistant={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    const firstCountry = screen
      .getByTestId('card_set_library__chip_select__work-set')
      .getAttribute('data-football-country');

    rerender(
      <CardSetLibraryPicker
        cards={cards}
        cardSets={cardSets}
        interfaceLanguage="en"
        targetLanguage="en"
        selectedCardSetId="work-set"
        onOpenAiAssistant={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByTestId('card_set_library__chip_select__work-set')).toHaveAttribute(
      'data-football-country',
      firstCountry ?? '',
    );
  });

  it.each([
    ['en', 'Open AI Assistant'],
    ['ru', 'Открыть AI помощника'],
    ['es', 'Abrir Asistente IA'],
  ] as const)('localizes the wand label in %s', (interfaceLanguage, label) => {
    render(
      <CardSetLibraryPicker
        cards={cards}
        cardSets={cardSets}
        interfaceLanguage={interfaceLanguage}
        targetLanguage="ru"
        selectedCardSetId="all-cards"
        onOpenAiAssistant={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    expect(
      screen.getByTestId('card_set_library__ai_assistant_button'),
    ).toHaveAttribute('aria-label', label);
  });
});

function makeCard(
  id: string,
  en: string,
  overrides: Partial<LanguageCard> = {},
): LanguageCard {
  return {
    id,
    translations: {
      en,
      ru: `${en} ru`,
      es: `${en} es`,
    },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeCardSet(
  id: string,
  name: string,
  cardIds: string[],
  names?: CardSet['names'],
): CardSet {
  return {
    id,
    name,
    names,
    cardIds,
    createdAt: now,
    updatedAt: now,
  };
}
