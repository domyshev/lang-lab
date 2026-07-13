import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CrosswordExercise } from '../CrosswordExercise';

describe('CrosswordExercise', () => {
  it('renders a cell grid and submits answers assembled from cells', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onFinish = vi.fn();

    render(
      <CrosswordExercise
        interfaceLanguage="ru"
        cardSetName="Все карточки"
        onCardSetOpen={vi.fn()}
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
        onFinish={onFinish}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Игра: Кроссворд' })).toBeInTheDocument();
    expect(screen.getByTestId('crossword_exercise__metadata_row')).toContainElement(
      screen.getByTestId('crossword_exercise__card_set_chip'),
    );
    expect(screen.getByTestId('crossword_exercise__metadata_row')).toContainElement(
      screen.getByTestId('crossword_exercise__progress_chip'),
    );
    expect(screen.getByTestId('crossword_exercise__card_set_chip')).toHaveTextContent(
      'Набор карточек: Все карточки',
    );
    expect(
      screen.getByTestId('crossword_exercise__card_set_chip__prefix'),
    ).toHaveStyle({
      fontSize: '11px',
    });
    expect(
      screen.getByTestId('crossword_exercise__card_set_chip__prefix').textContent,
    ).toBe('Набор карточек: ');
    expect(screen.getByTestId('crossword_exercise__progress_chip')).toHaveTextContent(
      '0 пройдено / 2 всего',
    );
    expect(screen.queryByText('До 6 слов из выбранной набора')).not.toBeInTheDocument();
    expect(screen.queryByTestId('crossword_exercise__clues')).not.toBeInTheDocument();
    expect(screen.getByTestId('crossword_exercise__clue_number__cat')).toHaveTextContent('1');
    expect(screen.getByTestId('crossword_exercise__clue_number__tea')).toHaveTextContent('2');
    expect(screen.getByTestId('crossword_exercise__clue_number__cat')).toHaveStyle({
      left: '-20px',
      top: '50%',
      transform: 'translateY(-50%)',
    });
    expect(screen.getByTestId('crossword_exercise__clue_number__tea')).toHaveStyle({
      left: '50%',
      top: '-20px',
      transform: 'translateX(-50%)',
    });
    expect(screen.getByRole('button', { name: 'Отправить кроссворд' })).toHaveStyle({
      alignSelf: 'flex-start',
    });
    expect(screen.getByRole('button', { name: 'Отправить кроссворд' })).toBeDisabled();
    expect(screen.getByTestId('crossword_exercise__submit_warning_icon')).toHaveTextContent(
      '!',
    );
    expect(screen.getByTestId('crossword_exercise__submit_warning_icon')).toHaveStyle({
      animation: 'disabledExerciseTooltipBlink 860ms ease-in-out infinite',
    });
    await user.hover(screen.getByTestId('crossword_exercise__submit_warning_anchor'));
    expect(
      await screen.findByText('Введите хотя бы одно слово, чтобы проверить результаты.'),
    ).toBeInTheDocument();

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
    expect(screen.getByTestId('crossword_exercise__progress_chip')).toHaveTextContent(
      '1 пройдено / 2 всего',
    );
    expect(screen.getByRole('button', { name: 'Отправить кроссворд' })).toBeEnabled();
    await user.type(screen.getByLabelText('Crossword cell 2 3'), 'e');
    await user.type(screen.getByLabelText('Crossword cell 3 3'), 'a');
    expect(screen.getByTestId('crossword_exercise__progress_chip')).toHaveTextContent(
      '2 пройдено / 2 всего',
    );
    await user.click(screen.getByRole('button', { name: 'Отправить кроссворд' }));

    expect(onSubmit).toHaveBeenCalledWith(
      { cat: 'cat', tea: 'tea' },
      expect.objectContaining({
        puzzle: expect.objectContaining({
          entries: expect.arrayContaining([
            expect.objectContaining({ cardId: 'cat' }),
            expect.objectContaining({ cardId: 'tea' }),
          ]),
        }),
        cellValues: {
          '0:0': 'c',
          '0:1': 'a',
          '0:2': 't',
          '1:2': 'e',
          '2:2': 'a',
        },
      }),
    );
    expect(screen.getByRole('button', { name: 'Пройдено!' })).toBeInTheDocument();
    expect(screen.getByTestId('crossword_exercise__completed_button_icon')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Пройдено!' }));
    expect(onFinish).toHaveBeenCalledOnce();
  });

  it('centers the finish action vertically inside the crossword panel', () => {
    render(
      <CrosswordExercise
        interfaceLanguage="ru"
        finishAction={
          <div data-test="crossword_test__finish_action">finish action</div>
        }
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
        onSubmit={vi.fn()}
      />,
    );

    const finishActionSlot = screen.getByTestId(
      'crossword_exercise__finish_action_slot',
    );

    expect(finishActionSlot).toContainElement(
      screen.getByTestId('crossword_test__finish_action'),
    );
    expect(finishActionSlot).toHaveStyle({
      position: 'absolute',
      right: '16px',
      top: '50%',
      transform: 'translateY(-50%)',
    });
  });

  it('submits all crossword words and colors the checked grid', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <CrosswordExercise
        interfaceLanguage="ru"
        cardSetName="Все карточки"
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

    await user.type(screen.getByLabelText('Crossword cell 1 1'), 'c');
    await user.type(screen.getByLabelText('Crossword cell 1 2'), 'a');
    await user.type(screen.getByLabelText('Crossword cell 1 3'), 't');
    await user.click(screen.getByRole('button', { name: 'Отправить кроссворд' }));

    expect(onSubmit).toHaveBeenCalledWith(
      { cat: 'cat', tea: 't' },
      expect.objectContaining({
        cellValues: {
          '0:0': 'c',
          '0:1': 'a',
          '0:2': 't',
        },
      }),
    );
    expect(screen.getByLabelText('Crossword cell 1 3')).toHaveStyle({
      backgroundColor: 'rgb(232, 247, 223)',
    });
    expect(screen.getByLabelText('Crossword cell 2 3')).not.toHaveStyle({
      backgroundColor: 'rgb(253, 232, 223)',
    });
    expect(screen.getByLabelText('Crossword cell 2 3')).toHaveValue('e');
    expect(screen.getByLabelText('Crossword cell 2 3')).toHaveStyle({
      color: 'rgba(32, 48, 21, 0.38)',
    });
    expect(screen.getByLabelText('Crossword cell 2 3')).not.toHaveStyle({
      backgroundColor: 'rgb(232, 247, 223)',
    });
    expect(screen.getByLabelText('Crossword cell 2 3')).not.toHaveStyle({
      backgroundColor: 'rgb(253, 232, 223)',
    });
    expect(screen.getByLabelText('Crossword cell 3 3')).toHaveValue('a');
  });

  it('colors submitted words and shows recent answer history from submitted cells', async () => {
    const user = userEvent.setup();

    render(
      <CrosswordExercise
        interfaceLanguage="ru"
        cardSetName="Все карточки"
        recentResultsByCardId={{
          cat: [
            {
              isCorrect: true,
              occurredAt: '2026-07-03T10:00:00.000Z',
            },
          ],
          tea: [
            {
              isCorrect: false,
              occurredAt: '2026-07-04T10:00:00.000Z',
            },
          ],
        }}
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
        onSubmit={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText('Crossword cell 1 1'), 'c');
    await user.type(screen.getByLabelText('Crossword cell 1 2'), 'a');
    await user.type(screen.getByLabelText('Crossword cell 1 3'), 't');
    await user.type(screen.getByLabelText('Crossword cell 2 3'), 'x');
    await user.type(screen.getByLabelText('Crossword cell 3 3'), 'x');
    await user.click(screen.getByRole('button', { name: 'Отправить кроссворд' }));

    expect(screen.getByLabelText('Crossword cell 1 1')).toHaveStyle({
      backgroundColor: 'rgb(232, 247, 223)',
    });
    expect(screen.getByLabelText('Crossword cell 1 3')).toHaveStyle({
      backgroundColor: 'rgb(232, 247, 223)',
    });
    expect(screen.getByLabelText('Crossword cell 2 3')).toHaveStyle({
      backgroundColor: 'rgb(253, 232, 223)',
    });
    expect(screen.getByLabelText('Crossword cell 1 3')).toHaveStyle({
      textDecorationLine: 'none',
    });
    expect(screen.getByLabelText('Crossword cell 2 3')).toHaveStyle({
      textDecorationLine: 'line-through',
    });
    expect(screen.getByLabelText('Crossword cell 3 3')).toHaveStyle({
      textDecorationLine: 'line-through',
    });

    await user.hover(screen.getByLabelText('Crossword cell 2 3'));

    const correctionTooltip = await screen.findByTestId(
      'crossword_exercise__correction__2_3__tooltip',
    );
    expect(
      screen.getByTestId('crossword_exercise__correction__2_3__popper'),
    ).toHaveAttribute('data-prevent-overflow', 'true');
    expect(screen.getByRole('tooltip').firstElementChild).toHaveStyle({
      maxHeight: 'calc(100vh - 32px)',
      overflowY: 'auto',
    });
    expect(
      within(correctionTooltip).getByTestId(
        'crossword_exercise__correction__2_3__entry__tea__answer',
      ),
    ).toHaveAccessibleName('tea');
    expect(
      within(correctionTooltip).getByTestId(
        'crossword_exercise__correction__2_3__entry__tea__answer__cell__0',
      ),
    ).toHaveStyle({
      backgroundColor: 'rgb(232, 247, 223)',
      borderColor: '#7fc77a',
    });
    expect(
      within(correctionTooltip).getByTestId(
        'crossword_exercise__correction__2_3__entry__tea__recent_title',
      ),
    ).toHaveStyle({
      marginTop: '10px',
    });
    expect(
      within(correctionTooltip).getByText('10 последних ответов'),
    ).toBeInTheDocument();
  });

  it('keeps advancing in the active direction after crossing another word', async () => {
    const user = userEvent.setup();

    render(
      <CrosswordExercise
        interfaceLanguage="ru"
        cardSetName="Все карточки"
        puzzle={{
          mode: 'words',
          bounds: { minRow: 0, maxRow: 2, minCol: 0, maxCol: 3 },
          cells: [
            { row: 0, col: 0, solution: 'c', entryIds: ['cart'] },
            { row: 0, col: 1, solution: 'a', entryIds: ['ape', 'cart'] },
            { row: 0, col: 2, solution: 'r', entryIds: ['cart'] },
            { row: 0, col: 3, solution: 't', entryIds: ['cart'] },
            { row: 1, col: 1, solution: 'p', entryIds: ['ape'] },
            { row: 2, col: 1, solution: 'e', entryIds: ['ape'] },
          ],
          entries: [
            {
              cardId: 'cart',
              answer: 'cart',
              clue: 'ru: тележка',
              row: 0,
              col: 0,
              direction: 'across',
            },
            {
              cardId: 'ape',
              answer: 'ape',
              clue: 'ru: обезьяна',
              row: 0,
              col: 1,
              direction: 'down',
            },
          ],
        }}
        onSubmit={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText('Crossword cell 1 1'), 'c');
    expect(screen.getByLabelText('Crossword cell 1 2')).toHaveFocus();

    await user.type(screen.getByLabelText('Crossword cell 1 2'), 'a');

    expect(screen.getByLabelText('Crossword cell 1 3')).toHaveFocus();
  });

  it('skips already-filled crossing cells while advancing in the active word direction', async () => {
    const user = userEvent.setup();

    render(
      <CrosswordExercise
        interfaceLanguage="ru"
        cardSetName="Все карточки"
        puzzle={{
          mode: 'words',
          bounds: { minRow: 0, maxRow: 2, minCol: 0, maxCol: 3 },
          cells: [
            { row: 0, col: 0, solution: 'c', entryIds: ['cart'] },
            { row: 0, col: 1, solution: 'a', entryIds: ['ape', 'cart'] },
            { row: 0, col: 2, solution: 'r', entryIds: ['cart'] },
            { row: 0, col: 3, solution: 't', entryIds: ['cart'] },
            { row: 1, col: 1, solution: 'p', entryIds: ['ape'] },
            { row: 2, col: 1, solution: 'e', entryIds: ['ape'] },
          ],
          entries: [
            {
              cardId: 'cart',
              answer: 'cart',
              clue: 'ru: тележка',
              row: 0,
              col: 0,
              direction: 'across',
            },
            {
              cardId: 'ape',
              answer: 'ape',
              clue: 'ru: обезьяна',
              row: 0,
              col: 1,
              direction: 'down',
            },
          ],
        }}
        onSubmit={vi.fn()}
      />,
    );

    await user.click(screen.getByTestId('crossword_exercise__clue_number__ape'));
    await user.type(screen.getByLabelText('Crossword cell 1 2'), 'a');

    await user.click(screen.getByTestId('crossword_exercise__clue_number__cart'));
    await user.type(screen.getByLabelText('Crossword cell 1 1'), 'c');

    expect(screen.getByLabelText('Crossword cell 1 3')).toHaveFocus();
  });

  it('opens the selected card set from the crossword card set chip', async () => {
    const user = userEvent.setup();
    const onCardSetOpen = vi.fn();

    render(
      <CrosswordExercise
        interfaceLanguage="ru"
        cardSetName="Все карточки"
        onCardSetOpen={onCardSetOpen}
        puzzle={{
          mode: 'words',
          bounds: { minRow: 0, maxRow: 0, minCol: 0, maxCol: 0 },
          cells: [{ row: 0, col: 0, solution: 'a', entryIds: ['a'] }],
          entries: [
            {
              cardId: 'a',
              answer: 'a',
              clue: 'ru: а',
              row: 0,
              col: 0,
              direction: 'across',
            },
          ],
        }}
        onSubmit={vi.fn()}
      />,
    );

    await user.hover(screen.getByTestId('crossword_exercise__card_set_chip'));

    expect(
      await screen.findByText('Кликните чтобы перейти к списку карточек набора.'),
    ).toBeInTheDocument();

    await user.click(screen.getByTestId('crossword_exercise__card_set_chip'));

    expect(onCardSetOpen).toHaveBeenCalled();
  });
});
