import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import { appReducer, defaultComplementaryLanguages } from '../../store/appSlice';
import { cardsReducer } from '../../store/cardsSlice';
import { ImportCardsView } from '../ImportCardsView';

function renderImportCardsView(interfaceLanguage: 'ru' | 'en' | 'es' = 'ru') {
  const store = configureStore({
    reducer: {
      app: appReducer,
      cards: cardsReducer,
    },
    preloadedState: {
      app: {
        assistantId: 'studyTroll' as const,
        complementaryLanguages: defaultComplementaryLanguages,
        interfaceLanguage,
        targetLanguage: 'en' as const,
      },
      cards: {
        cards: [],
        duplicateProcessingHistory: [],
        pendingDuplicates: [],
      },
    },
  });

  render(
    <Provider store={store}>
      <ImportCardsView />
    </Provider>,
  );

  return store;
}

describe('ImportCardsView', () => {
  it('localizes the agents view, manual file import, and format link', () => {
    renderImportCardsView('ru');

    expect(screen.getByRole('heading', { name: 'Агенты LLM' })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Open Router' }),
    ).toHaveAttribute('href', 'https://openrouter.ai/');
    expect(screen.getByTestId('agents_view__open_router_intro')).toHaveTextContent(
      'Пользователь может добавить свой ключ Open Router, чтобы запускать агентские функции через свои лимиты.',
    );
    expect(screen.getByRole('heading', { name: 'Ручной импорт карточек' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'Вы можете также подготовить данные для своей учебной лаборатории через внешнего LLM агента и загрузить их здесь в нашем формате. Просто скачайте требования и передайте их вашему агенту.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Сейчас сохранено: 0 карточек')).toBeInTheDocument();
    const requirementsLink = screen.getByRole('link', {
      name: 'Скачать требования к JSON для агентов',
    });
    expect(requirementsLink).toHaveAttribute(
      'href',
      expect.stringContaining('LANGUAGE_CARD_FORMAT.md'),
    );
    expect(requirementsLink).toHaveAttribute('download');
    expect(requirementsLink).toHaveStyle({
      textDecorationLine: 'underline',
    });
    expect(screen.getByRole('button', { name: 'Выбрать JSON-файл' })).toHaveStyle({
      backgroundColor: '#eef8fc',
      borderColor: 'rgba(37, 118, 150, 0.42)',
      color: '#174e69',
    });
    expect(screen.queryByRole('button', { name: 'Вставить JSON' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('JSON карточек')).not.toBeInTheDocument();
    expect(screen.queryByText('Load a JSON file or paste a JSON array of language cards.')).not.toBeInTheDocument();
    expect(screen.queryByText('0 cards currently stored')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Import' })).not.toBeInTheDocument();
  });

  it('imports a selected file without copying it into the paste field', async () => {
    const user = userEvent.setup();
    const json = JSON.stringify([
      {
        translations: {
          en: 'vehicle',
          ru: 'транспортное средство',
          es: 'vehiculo',
        },
      },
    ]);

    const store = renderImportCardsView();

    const fileInput = screen.getByLabelText('Выбрать JSON-файл');
    const file = new File([json], 'cards.json', { type: 'application/json' });
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(store.getState().cards.cards).toHaveLength(1);
    });
    expect(screen.getByText('Добавлено: 1')).toBeInTheDocument();
    expect(screen.queryByLabelText('Cards JSON')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Вставить JSON' })).not.toBeInTheDocument();
  });
});
