import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import { rootReducer } from '../../store/store';
import { ImportCardsView } from '../ImportCardsView';

function renderImportCardsView(interfaceLanguage: 'ru' | 'en' | 'es' = 'ru') {
  const initial = rootReducer(undefined, { type: 'test/init' });
  const store = configureStore({
    reducer: rootReducer,
    preloadedState: {
      ...initial,
      app: { ...initial.app, interfaceLanguage },
    },
  });

  render(
    <Provider store={store}>
      <ImportCardsView />
    </Provider>,
  );

  return store;
}

describe('ImportCardsView compatibility wrapper', () => {
  it('renders the localized AI assistant workspace on the existing route', () => {
    renderImportCardsView('ru');

    expect(screen.getByRole('heading', { name: 'AI-ассистент' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Подключение' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Чат' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'История операций' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ручной импорт карточек' })).toBeInTheDocument();
    expect(screen.queryByText(/триальн/i)).not.toBeInTheDocument();
  });

  it('keeps file import functional through the compatibility route', async () => {
    const user = userEvent.setup();
    const store = renderImportCardsView('en');
    const file = new File([
      JSON.stringify([
        {
          translations: {
            en: 'vehicle',
            ru: 'транспортное средство',
            es: 'vehiculo',
          },
        },
      ]),
    ], 'cards.json', { type: 'application/json' });

    await user.upload(screen.getByLabelText('Choose JSON file'), file);
    await waitFor(() => expect(store.getState().cards.cards).toHaveLength(1));
    expect(screen.getByText('Added: 1')).toBeInTheDocument();
  });
});
