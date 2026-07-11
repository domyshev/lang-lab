import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';
import { MissingWordExercise } from '../MissingWordExercise';
import { appReducer } from '../../../store/appSlice';
import { attemptsReducer } from '../../../store/attemptsSlice';
import { cardsReducer } from '../../../store/cardsSlice';
import { statsReducer } from '../../../store/statsSlice';
import { cardSetsReducer } from '../../../store/cardSetsSlice';

describe('MissingWordExercise', () => {
  it('marks an in-session repeated phrase with a repeat chip', () => {
    render(
      <Provider store={createStore()}>
        <MissingWordExercise
          isRepeatedPrompt
          prompt={{
            cardId: 'worth-it',
            prompt: 'ru: оно того стоит',
            expectedAnswer: 'worth it',
            sentenceWithGap: 'It is _____ today.',
            translationHints: [{ language: 'ru', value: 'оно того стоит' }],
          }}
          onAnswer={vi.fn()}
          onNext={vi.fn()}
        />
      </Provider>,
    );

    expect(
      screen.getByTestId('missing_word_exercise__repeat_chip__worth-it'),
    ).toHaveTextContent('повтор');
    expect(
      screen.getByTestId('missing_word_exercise__repeat_icon__worth-it'),
    ).toBeInTheDocument();
  });

  it('shows a memorize state without saving stats for an empty answer', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    const onNext = vi.fn();

    render(
      <Provider store={createStore()}>
        <MissingWordExercise
          prompt={{
            cardId: 'worth-it',
            prompt: 'ru: оно того стоит',
            expectedAnswer: 'worth it',
            sentenceWithGap: 'It is _____ today.',
            translationHints: [{ language: 'ru', value: 'оно того стоит' }],
          }}
          onAnswer={onAnswer}
          onNext={onNext}
        />
      </Provider>,
    );

    await user.click(screen.getByRole('button', { name: 'Отправить' }));

    expect(onAnswer).not.toHaveBeenCalled();
    expect(
      screen.queryByLabelText('Заполните все пропуски'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Правильный ответ')).toBeInTheDocument();
    const correctAnswer = screen.getByLabelText('Правильный ответ: worth it');
    expect(correctAnswer).toBeInTheDocument();
    expect(within(correctAnswer).getByText('w')).toHaveStyle({
      color: 'rgb(32, 48, 21)',
    });
    expect(screen.queryByRole('button', { name: 'Неверно' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Запомнить!' })).toHaveStyle({
      backgroundColor: 'rgb(255, 243, 205)',
    });
    expect(screen.queryByRole('textbox', { name: 'Ответ' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Запомнить!' }));
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('renders the missing phrase inline as letter cells and shows the correct phrase after a mistake', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    const onNext = vi.fn();

    render(
      <Provider store={createStore()}>
        <MissingWordExercise
          prompt={{
            cardId: 'worth-it',
            prompt: 'ru: оно того стоит',
            expectedAnswer: 'worth it',
            sentenceWithGap: 'It is _____ today.',
            translationHints: [{ language: 'ru', value: 'оно того стоит' }],
          }}
          onAnswer={onAnswer}
          onNext={onNext}
        />
      </Provider>,
    );

    expect(screen.getByText('It is')).toBeInTheDocument();
    expect(screen.getByText('today.')).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Missing word letter/)).toHaveLength(3);
    expect(screen.getByText('w')).toBeInTheDocument();
    expect(screen.getByText('r')).toBeInTheDocument();
    expect(screen.getByText('h')).toBeInTheDocument();
    expect(screen.getByText('i')).toBeInTheDocument();
    expect(screen.getByTestId('missing_word_exercise__answer_cells__worth-it__space__5')).toHaveStyle({
      width: '38px',
    });
    expect(screen.queryByRole('textbox', { name: 'Ответ' })).not.toBeInTheDocument();

    const inputs = screen.getAllByLabelText(/Missing word letter/);
    await user.type(inputs[0], 'x');
    await user.type(inputs[1], 'x');
    await user.type(inputs[2], 'x');
    await user.click(screen.getByRole('button', { name: 'Отправить' }));

    expect(onAnswer).toHaveBeenCalledWith('wxrxh ix');
    const submittedInputs = screen.getAllByLabelText(/Missing word letter/);
    expect(submittedInputs[0]).toHaveStyle({
      textDecorationLine: 'line-through',
    });
    expect(submittedInputs[1]).toHaveStyle({
      textDecorationLine: 'line-through',
    });
    expect(submittedInputs[2]).toHaveStyle({
      textDecorationLine: 'line-through',
    });
    expect(
      screen.getByTestId(
        'missing_word_exercise__correct_answer_cell__worth-it__1',
      ),
    ).toHaveStyle({ textDecorationLine: 'none' });
    expect(screen.getByRole('button', { name: 'Неверно' })).toBeInTheDocument();
    expect(screen.getByText('Правильный ответ')).toBeInTheDocument();
    const correctAnswer = screen.getByLabelText('Правильный ответ: worth it');
    expect(correctAnswer).toBeInTheDocument();
    expect(within(correctAnswer).getByText('w')).toHaveStyle({
      color: 'rgb(32, 48, 21)',
    });
    expect(screen.getByTestId('missing_word_exercise__correct_answer_space__worth-it__5')).toHaveStyle({
      width: '38px',
    });

    await user.click(screen.getByRole('button', { name: 'Неверно' }));
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('keeps punctuation in a fixed cell instead of asking the user to type it', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();

    render(
      <Provider store={createStore()}>
        <MissingWordExercise
          prompt={{
            cardId: 'the-end',
            prompt: 'ru: конец',
            expectedAnswer: 'the end.',
            sentenceWithGap: 'This is _____.',
            translationHints: [{ language: 'ru', value: 'конец' }],
          }}
          onAnswer={onAnswer}
          onNext={vi.fn()}
        />
      </Provider>,
    );

    expect(screen.getAllByLabelText(/Missing word letter/)).toHaveLength(2);
    expect(
      screen.getByTestId('missing_word_exercise__answer_cells__the-end__fixed_cell__7'),
    ).toHaveTextContent('.');

    const inputs = screen.getAllByLabelText(/Missing word letter/);
    await user.type(inputs[0], 'h');
    await user.type(inputs[1], 'n');
    await user.click(screen.getByRole('button', { name: 'Отправить' }));

    expect(onAnswer).toHaveBeenCalledWith('the end.');
    expect(screen.getByRole('button', { name: 'Правильно!' })).toBeInTheDocument();
  });

  it('shows a green success state without repeating the correct phrase', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();

    render(
      <Provider store={createStore()}>
        <MissingWordExercise
          prompt={{
            cardId: 'worth-it',
            prompt: 'ru: оно того стоит',
            expectedAnswer: 'worth it',
            sentenceWithGap: 'It is _____ today.',
            translationHints: [{ language: 'ru', value: 'оно того стоит' }],
          }}
          onAnswer={onAnswer}
          onNext={vi.fn()}
        />
      </Provider>,
    );

    const letters = ['o', 't', 't'];
    const inputs = screen.getAllByLabelText(/Missing word letter/);
    for (let index = 0; index < inputs.length; index += 1) {
      await user.type(inputs[index], letters[index]);
    }
    await user.click(screen.getByRole('button', { name: 'Отправить' }));

    expect(onAnswer).toHaveBeenCalledWith('worth it');
    expect(screen.queryByText('Правильный ответ')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Правильно!' })).toBeInTheDocument();
  });

  it('does not show an artificial sentence when a phrase has no example', () => {
    render(
      <Provider store={createStore()}>
        <MissingWordExercise
          prompt={{
            cardId: 'look-forward',
            prompt: 'ru: с нетерпением ждать',
            expectedAnswer: 'look forward',
            sentenceWithGap: '_____',
            translationHints: [
              { language: 'ru', value: 'с нетерпением ждать' },
            ],
          }}
          onAnswer={vi.fn()}
          onNext={vi.fn()}
        />
      </Provider>,
    );

    expect(screen.queryByText(/I need to remember/)).not.toBeInTheDocument();
    expect(screen.getAllByLabelText(/Missing word letter/)).toHaveLength(5);
  });

  it('moves focus to the next answer letter and skips spaces', async () => {
    const user = userEvent.setup();

    render(
      <Provider store={createStore()}>
        <MissingWordExercise
          prompt={{
            cardId: 'worth-it',
            prompt: 'ru: оно того стоит',
            expectedAnswer: 'worth it',
            sentenceWithGap: 'It is _____ today.',
            translationHints: [{ language: 'ru', value: 'оно того стоит' }],
          }}
          onAnswer={vi.fn()}
          onNext={vi.fn()}
        />
      </Provider>,
    );

    const inputs = screen.getAllByLabelText(/Missing word letter/);
    await user.type(inputs[1], 't');

    expect(inputs[2]).toHaveFocus();
  });

  it('focuses the first missing word letter so typing can start immediately', async () => {
    const user = userEvent.setup();

    render(
      <Provider store={createStore()}>
        <MissingWordExercise
          prompt={{
            cardId: 'worth-it',
            prompt: 'ru: оно того стоит',
            expectedAnswer: 'worth it',
            sentenceWithGap: 'It is _____ today.',
            translationHints: [{ language: 'ru', value: 'оно того стоит' }],
          }}
          onAnswer={vi.fn()}
          onNext={vi.fn()}
        />
      </Provider>,
    );

    const inputs = screen.getAllByLabelText(/Missing word letter/);
    await waitFor(() => expect(inputs[0]).toHaveFocus());

    await user.keyboard('o');

    expect(inputs[0]).toHaveValue('o');
    expect(inputs[1]).toHaveFocus();
  });

  it('submits with Enter from any missing word cell', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    const onNext = vi.fn();

    render(
      <Provider store={createStore()}>
        <MissingWordExercise
          prompt={{
            cardId: 'worth-it',
            prompt: 'ru: оно того стоит',
            expectedAnswer: 'worth it',
            sentenceWithGap: 'It is _____ today.',
            translationHints: [{ language: 'ru', value: 'оно того стоит' }],
          }}
          onAnswer={onAnswer}
          onNext={onNext}
        />
      </Provider>,
    );

    const inputs = screen.getAllByLabelText(/Missing word letter/);
    await user.type(inputs[0], 'o');
    expect(screen.getByText('w')).toHaveStyle({ color: 'rgb(95, 107, 87)' });
    expect(inputs[0]).toHaveStyle({ color: 'rgb(32, 48, 21)' });
    await user.type(inputs[1], 't');
    await user.type(inputs[2], 't{enter}');

    expect(onAnswer).toHaveBeenCalledWith('worth it');
    expect(screen.getByRole('button', { name: 'Правильно!' })).toBeInTheDocument();

    await user.keyboard('{Enter}');
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('does not bubble the submit Enter from a word cell to document shortcuts', async () => {
    const user = userEvent.setup();
    const enterSpy = vi.fn();
    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        enterSpy();
      }
    };
    document.addEventListener('keydown', handleDocumentKeyDown);

    try {
      render(
        <Provider store={createStore()}>
          <MissingWordExercise
            prompt={{
              cardId: 'worth-it',
              prompt: 'ru: оно того стоит',
              expectedAnswer: 'worth it',
              sentenceWithGap: 'It is _____ today.',
              translationHints: [{ language: 'ru', value: 'оно того стоит' }],
            }}
            onAnswer={vi.fn()}
            onNext={vi.fn()}
          />
        </Provider>,
      );

      const inputs = screen.getAllByLabelText(/Missing word letter/);
      await user.type(inputs[0], 'o');
      await user.type(inputs[1], 't');
      await user.type(inputs[2], 't{enter}');

      expect(screen.getByRole('button', { name: 'Правильно!' })).toBeInTheDocument();
      expect(enterSpy).not.toHaveBeenCalled();
    } finally {
      document.removeEventListener('keydown', handleDocumentKeyDown);
    }
  });

  it('advances incorrect results with Enter after submitting from a word cell', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();

    render(
      <Provider store={createStore()}>
        <MissingWordExercise
          prompt={{
            cardId: 'worth-it',
            prompt: 'ru: оно того стоит',
            expectedAnswer: 'worth it',
            sentenceWithGap: 'It is _____ today.',
            translationHints: [{ language: 'ru', value: 'оно того стоит' }],
          }}
          onAnswer={vi.fn()}
          onNext={onNext}
        />
      </Provider>,
    );

    const inputs = screen.getAllByLabelText(/Missing word letter/);
    await user.type(inputs[0], 'x');
    await user.type(inputs[1], 'x');
    await user.type(inputs[2], 'x{enter}');

    expect(screen.getByRole('button', { name: 'Неверно' })).toBeInTheDocument();

    await user.keyboard('{Enter}');
    expect(onNext).toHaveBeenCalledOnce();
  });
});

function createStore() {
  return configureStore({
    reducer: {
      app: appReducer,
      attempts: attemptsReducer,
      cards: cardsReducer,
      stats: statsReducer,
      cardSets: cardSetsReducer,
    },
  });
}
