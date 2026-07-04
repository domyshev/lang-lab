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
        />
      </Provider>,
    );

    await user.click(screen.getByRole('button', { name: 'Отправить' }));

    expect(onAnswer).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Заполните все пропуски')).toBeInTheDocument();
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
