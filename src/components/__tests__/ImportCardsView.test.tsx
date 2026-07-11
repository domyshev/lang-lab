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

  it.each([
    [
      'en',
      'not-json',
      'The selected file does not contain valid JSON.',
      'JSON is not valid.',
    ],
    [
      'ru',
      'not-json',
      'Выбранный файл не содержит корректный JSON.',
      'JSON is not valid.',
    ],
    [
      'es',
      'not-json',
      'El archivo seleccionado no contiene JSON valido.',
      'JSON is not valid.',
    ],
    [
      'en',
      '{}',
      'The top-level JSON value must be an array of cards.',
      'Root value must be an array.',
    ],
    [
      'ru',
      '{}',
      'Верхнее значение JSON должно быть массивом карточек.',
      'Root value must be an array.',
    ],
    [
      'es',
      '{}',
      'El valor JSON principal debe ser una lista de tarjetas.',
      'Root value must be an array.',
    ],
  ] as const)(
    'localizes root import errors in %s',
    async (language, contents, expected, domainReason) => {
      const user = userEvent.setup();
      renderImportCardsView(language);

      await user.upload(
        screen.getByLabelText(
          language === 'ru'
            ? 'Выбрать JSON-файл'
            : language === 'es'
              ? 'Elegir archivo JSON'
              : 'Choose JSON file',
        ),
        new File([contents], 'invalid.json', { type: 'application/json' }),
      );

      expect(await screen.findByText(expected)).toBeInTheDocument();
      if (language !== 'en') {
        expect(document.body).not.toHaveTextContent(domainReason);
      }
      expect(screen.getByTestId('import_cards__root_error__0')).toBeInTheDocument();
    },
  );

  it.each([
    [
      'en',
      [null],
      'Each card entry must be an object.',
      'Record must be an object.',
    ],
    [
      'ru',
      [null],
      'Каждая запись карточки должна быть объектом.',
      'Record must be an object.',
    ],
    [
      'es',
      [null],
      'Cada registro de tarjeta debe ser un objeto.',
      'Record must be an object.',
    ],
    [
      'en',
      [{ translations: { en: 'one' } }],
      'Each card needs translations in at least two supported languages.',
      'Card must include translations for at least two supported languages.',
    ],
    [
      'ru',
      [{ translations: { en: 'one' } }],
      'Для каждой карточки нужны переводы минимум на два поддерживаемых языка.',
      'Card must include translations for at least two supported languages.',
    ],
    [
      'es',
      [{ translations: { en: 'one' } }],
      'Cada tarjeta necesita traducciones en al menos dos idiomas compatibles.',
      'Card must include translations for at least two supported languages.',
    ],
  ] as const)(
    'localizes record import errors in %s',
    async (language, records, expected, domainReason) => {
      const user = userEvent.setup();
      renderImportCardsView(language);

      await user.upload(
        screen.getByLabelText(
          language === 'ru'
            ? 'Выбрать JSON-файл'
            : language === 'es'
              ? 'Elegir archivo JSON'
              : 'Choose JSON file',
        ),
        new File([JSON.stringify(records)], 'invalid-record.json', {
          type: 'application/json',
        }),
      );

      const recordError = await screen.findByTestId(
        'import_cards__record_error__0',
      );
      expect(recordError).toHaveTextContent(expected);
      if (language !== 'en') {
        expect(document.body).not.toHaveTextContent(domainReason);
      }
      expect(recordError).toBeInTheDocument();
    },
  );
});
