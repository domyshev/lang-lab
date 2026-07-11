import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { CrosswordAttemptSnapshot } from '../../../domain/exercises';
import { CrosswordHistoryReplay } from '../CrosswordHistoryReplay';

const snapshot: CrosswordAttemptSnapshot = {
  puzzle: {
    mode: 'words',
    bounds: { minRow: 0, maxRow: 2, minCol: 0, maxCol: 2 },
    cells: [
      { row: 0, col: 0, solution: 'c', entryIds: ['cat'] },
      { row: 0, col: 1, solution: 'a', entryIds: ['cat'] },
      { row: 0, col: 2, solution: 't', entryIds: ['cat', 'tea'] },
      { row: 1, col: 2, solution: 'e', entryIds: ['tea'] },
      { row: 2, col: 2, solution: 'a', entryIds: ['tea'] },
    ],
    entries: [
      {
        cardId: 'cat',
        answer: 'cat',
        clue: 'ru: кот',
        row: 0,
        col: 0,
        direction: 'across',
      },
      {
        cardId: 'tea',
        answer: 'tea',
        clue: 'ru: чай',
        row: 0,
        col: 2,
        direction: 'down',
      },
    ],
  },
  cellValues: {
    '0:0': 'c',
    '0:1': 'a',
    '0:2': 't',
    '1:2': 'x',
  },
};

describe('CrosswordHistoryReplay', () => {
  it('replays saved cells with completed-word feedback and localized tooltips', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <CrosswordHistoryReplay
        correctness={{ cat: true }}
        dataTestPrefix="crossword_history"
        interfaceLanguage="ru"
        snapshot={snapshot}
      />,
    );

    expect(screen.getByTestId('crossword_history__grid')).toBeInTheDocument();
    expect(
      screen.getByTestId('crossword_history__clue_number__cat'),
    ).toHaveTextContent('1');
    expect(
      screen.getByTestId('crossword_history__clue_number__tea'),
    ).toHaveTextContent('2');
    expect(screen.getByTestId('crossword_history__cell__1_1')).toHaveTextContent(
      'c',
    );
    expect(screen.getByTestId('crossword_history__cell__3_3')).toHaveTextContent(
      '',
    );
    expect(
      screen.getByTestId('crossword_history__empty_cell__2_1'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('crossword_history__cell__1_1')).toHaveStyle({
      backgroundColor: 'rgb(235, 247, 225)',
    });
    expect(screen.getByTestId('crossword_history__cell__2_3')).not.toHaveStyle({
      backgroundColor: 'rgb(253, 235, 238)',
    });

    await user.hover(screen.getByTestId('crossword_history__clue_number__tea'));
    expect(await screen.findByText('Вопрос')).toBeInTheDocument();
    expect(await screen.findByText('ru: чай')).toBeInTheDocument();
    expect(
      screen.getByTestId('crossword_history__clue_tooltip__tea'),
    ).toBeInTheDocument();
    await user.unhover(screen.getByTestId('crossword_history__clue_number__tea'));

    rerender(
      <CrosswordHistoryReplay
        correctness={{ cat: true, tea: false }}
        dataTestPrefix="crossword_history"
        interfaceLanguage="ru"
        snapshot={{
          ...snapshot,
          cellValues: { ...snapshot.cellValues, '2:2': 'x' },
        }}
      />,
    );

    expect(screen.getByTestId('crossword_history__cell__2_3')).toHaveStyle({
      backgroundColor: 'rgb(253, 235, 238)',
      textDecorationLine: 'line-through',
    });
    expect(screen.getByTestId('crossword_history__cell__1_3')).toHaveStyle({
      backgroundColor: 'rgb(253, 235, 238)',
      textDecorationLine: 'none',
    });
    expect(
      screen.getByTestId('crossword_history__correction__2_3__anchor'),
    ).toBeInTheDocument();

    await user.hover(screen.getByTestId('crossword_history__cell__2_3'));
    expect(
      await screen.findByText('Правильный ответ: tea'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('crossword_history__correction__2_3__tooltip'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('crossword_history__correction__2_3__tooltip_arrow'),
    ).toBeInTheDocument();
  });
});
