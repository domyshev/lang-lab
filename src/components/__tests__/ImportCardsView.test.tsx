import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import { appReducer } from '../../store/appSlice';
import { cardsReducer } from '../../store/cardsSlice';
import { ImportCardsView } from '../ImportCardsView';

function renderImportCardsView() {
  const store = configureStore({
    reducer: {
      app: appReducer,
      cards: cardsReducer,
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
    expect(screen.getByText('Added: 1')).toBeInTheDocument();
    expect(screen.queryByLabelText('Cards JSON')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Вставить JSON' }));
    expect(screen.getByLabelText('JSON карточек')).toHaveValue('');
  });
});
