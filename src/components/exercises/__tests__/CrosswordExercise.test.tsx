import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CrosswordExercise } from '../CrosswordExercise';

describe('CrosswordExercise', () => {
  it('renders a cell grid and submits answers assembled from cells', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <CrosswordExercise
        interfaceLanguage="ru"
        themeName="Все слова"
        puzzle={{
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
        }}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Кроссворд' })).toBeInTheDocument();
    expect(screen.getByText('Тема "Все слова"')).toBeInTheDocument();
    expect(screen.queryByText('До 6 слов из выбранной темы')).not.toBeInTheDocument();
    expect(screen.queryByTestId('crossword_exercise__clues')).not.toBeInTheDocument();
    expect(screen.getByTestId('crossword_exercise__clue_number__cat')).toHaveTextContent('1');
    expect(screen.getByTestId('crossword_exercise__clue_number__tea')).toHaveTextContent('2');
    expect(screen.getByTestId('crossword_exercise__clue_number__cat')).toHaveStyle({
      left: '-18px',
      top: '-18px',
    });
    expect(screen.getByRole('button', { name: 'Отправить кроссворд' })).toHaveStyle({
      alignSelf: 'flex-start',
    });

    await user.hover(screen.getByTestId('crossword_exercise__clue_number__cat'));
    expect(await screen.findByText('Вопрос')).toBeInTheDocument();
    const clueText = await screen.findByText('ru: кот');
    expect(clueText).toHaveStyle({ fontSize: '14px' });
    expect(screen.getByTestId('crossword_exercise__clue_tooltip')).toHaveStyle({
      backgroundColor: 'rgb(255, 255, 255)',
    });

    await user.type(screen.getByLabelText('Crossword cell 1 1'), 'c');
    expect(screen.getByLabelText('Crossword cell 1 2')).toHaveFocus();
    await user.type(screen.getByLabelText('Crossword cell 1 2'), 'a');
    await user.type(screen.getByLabelText('Crossword cell 1 3'), 't');
    await user.type(screen.getByLabelText('Crossword cell 2 3'), 'e');
    await user.type(screen.getByLabelText('Crossword cell 3 3'), 'a');
    await user.click(screen.getByRole('button', { name: 'Отправить кроссворд' }));

    expect(onSubmit).toHaveBeenCalledWith({ cat: 'cat', tea: 'tea' });
  });
});
