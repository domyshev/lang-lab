import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';
import { MissingWordExercise } from '../MissingWordExercise';
import { appReducer } from '../../../store/appSlice';
import { attemptsReducer } from '../../../store/attemptsSlice';
import { cardsReducer } from '../../../store/cardsSlice';
import { statsReducer } from '../../../store/statsSlice';
import { themesReducer } from '../../../store/themesSlice';

describe('MissingWordExercise', () => {
  it('flashes a warning and does not submit an empty answer', async () => {
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

    await user.click(screen.getByRole('button', { name: 'Отправить' }));

    expect(onAnswer).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Заполните все пропуски')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Ответ' })).not.toBeInTheDocument();
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
    expect(screen.getAllByLabelText(/Missing word letter/)).toHaveLength(7);
    expect(screen.queryByRole('textbox', { name: 'Ответ' })).not.toBeInTheDocument();

    for (const input of screen.getAllByLabelText(/Missing word letter/)) {
      await user.type(input, 'x');
    }
    await user.click(screen.getByRole('button', { name: 'Отправить' }));

    expect(onAnswer).toHaveBeenCalledWith('xxxxx xx');
    expect(screen.getByRole('button', { name: 'Неверно' })).toBeInTheDocument();
    expect(screen.getByText('Правильный ответ')).toBeInTheDocument();
    expect(screen.getByLabelText('Правильный ответ: worth it')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Неверно' }));
    expect(onNext).toHaveBeenCalledOnce();
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

    const letters = 'worthit'.split('');
    const inputs = screen.getAllByLabelText(/Missing word letter/);
    for (let index = 0; index < inputs.length; index += 1) {
      await user.type(inputs[index], letters[index]);
    }
    await user.click(screen.getByRole('button', { name: 'Отправить' }));

    expect(onAnswer).toHaveBeenCalledWith('worth it');
    expect(screen.queryByText('Правильный ответ')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Правильно!' })).toBeInTheDocument();
  });
});

function createStore() {
  return configureStore({
    reducer: {
      app: appReducer,
      attempts: attemptsReducer,
      cards: cardsReducer,
      stats: statsReducer,
      themes: themesReducer,
    },
  });
}
