import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import { appReducer } from '../../store/appSlice';
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
  it('localizes the import helper text, stored count, action, and format link', async () => {
    const user = userEvent.setup();

    renderImportCardsView('ru');

    expect(
      screen.getByText(
        'Загрузите JSON-файл или вставьте JSON-массив языковых карточек.',
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

    await user.click(screen.getByRole('button', { name: 'Вставить JSON' }));
    expect(screen.getByRole('button', { name: 'Импортировать' })).toBeInTheDocument();
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

    await user.click(screen.getByRole('button', { name: 'Вставить JSON' }));
    expect(screen.getByLabelText('JSON карточек')).toHaveValue('');
  });
});
