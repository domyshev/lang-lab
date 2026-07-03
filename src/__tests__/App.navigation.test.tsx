import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import { App } from '../App';
import { appReducer } from '../store/appSlice';
import { attemptsReducer } from '../store/attemptsSlice';
import { cardsReducer } from '../store/cardsSlice';
import { statsReducer } from '../store/statsSlice';
import { themesReducer } from '../store/themesSlice';

const now = '2026-07-03T12:00:00.000Z';

function renderApp() {
  const store = configureStore({
    reducer: {
      app: appReducer,
      attempts: attemptsReducer,
      cards: cardsReducer,
      stats: statsReducer,
      themes: themesReducer,
    },
    preloadedState: {
      cards: {
        cards: [
          {
            id: 'card-worth-it',
            translations: {
              en: 'worth it',
              ru: 'оно того стоит',
              es: 'vale la pena',
            },
            createdAt: now,
            updatedAt: now,
          },
        ],
        duplicateProcessingHistory: [],
        pendingDuplicates: [],
      },
    },
  });

  render(
    <Provider store={store}>
      <App />
    </Provider>,
  );

  return store;
}

describe('App navigation', () => {
  it('starts in Russian and shows a simple game setup tab before starting', () => {
    renderApp();

    expect(screen.getByRole('tab', { name: 'Игра' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Карточки' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Статистика' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Импорт' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Начать' })).toBeInTheDocument();
    expect(screen.queryByText('worth it')).not.toBeInTheDocument();
  });

  it('shows All words as a fixed cards topic without an archive action', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('tab', { name: 'Карточки' }));

    const allWordsTopic = screen.getByRole('button', { name: /Все слова/ });
    expect(allWordsTopic).toBeInTheDocument();
    expect(allWordsTopic).toHaveTextContent('1');
    expect(
      screen.queryByRole('button', { name: 'В архив: Все слова' }),
    ).not.toBeInTheDocument();

    await user.click(allWordsTopic);
    expect(screen.getByText('worth it')).toBeInTheDocument();
  });

  it('keeps missing letters on the answered word and shows the correct answer result', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: 'Пропущенные буквы' }));
    await user.click(screen.getByRole('button', { name: 'Начать' }));

    expect(screen.getByRole('heading', { name: 'Пропущенные буквы' })).toBeInTheDocument();

    const missingLetterInputs = screen.getAllByLabelText(/Missing letter/);
    await user.type(missingLetterInputs[0], 'x');
    await user.type(missingLetterInputs[1], 'x');
    await user.type(missingLetterInputs[2], 'x');
    await user.click(screen.getByRole('button', { name: 'Отправить' }));

    expect(screen.getByText('Правильный ответ')).toBeInTheDocument();
    expect(screen.getByText('worth it')).toBeInTheDocument();
    expect(screen.queryByText(/direct/)).not.toBeInTheDocument();
    expect(screen.queryByText(/weighted/)).not.toBeInTheDocument();
    expect(screen.queryByText('missingLetters')).not.toBeInTheDocument();
    expect(screen.getByText('Неверно: 1')).toBeInTheDocument();
    expect(
      screen.queryByText(/Точность: .*Слабые карточки/),
    ).not.toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Следующий' })).toBeInTheDocument();
    expect(missingLetterInputs[0]).toBeDisabled();
  });

  it('shows assistant character settings in the header', () => {
    renderApp();

    expect(screen.getByLabelText('Персонаж')).toBeInTheDocument();
  });
});
