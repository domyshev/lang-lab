import { configureStore } from '@reduxjs/toolkit';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import { appReducer } from '../../store/appSlice';
import type { ComplementaryLanguages } from '../../store/appSlice';
import { attemptsReducer } from '../../store/attemptsSlice';
import { cardsReducer } from '../../store/cardsSlice';
import { statsReducer } from '../../store/statsSlice';
import { cardSetsReducer } from '../../store/cardSetsSlice';
import { LanguageSelectors } from '../LanguageSelectors';

describe('LanguageSelectors', () => {
  it('keeps all header selectors compact', () => {
    render(
      <Provider store={createStore()}>
        <LanguageSelectors />
      </Provider>,
    );

    expect(
      screen.getByTestId('language_selectors__interface_language_select'),
    ).toHaveStyle({
      height: '34px',
    });
    expect(screen.getByTestId('language_selectors__target_language_select')).toHaveStyle({
      height: '34px',
    });
    expect(
      screen.getByTestId('language_selectors__companion_languages_select'),
    ).toHaveStyle({
      height: '34px',
    });
  });

  it('shows language options in their own languages', async () => {
    const user = userEvent.setup();

    render(
      <Provider store={createStore()}>
        <LanguageSelectors />
      </Provider>,
    );

    fireEvent.mouseDown(
      within(
        screen.getByTestId('language_selectors__interface_language_control'),
      ).getByRole('combobox'),
    );

    expect(
      screen.getByTestId('language_selectors__interface_language_option_label__ru__name'),
    ).toHaveTextContent('Русский');
    expect(
      screen.getByTestId('language_selectors__interface_language_option_label__en__name'),
    ).toHaveTextContent('English');
    expect(
      screen.getByTestId('language_selectors__interface_language_option_label__es__name'),
    ).toHaveTextContent('Español');
    expect(
      screen.getByTestId('language_selectors__interface_language_option_label__uk__name'),
    ).toHaveTextContent('Українська');

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    fireEvent.mouseDown(
      within(
        screen.getByTestId('language_selectors__target_language_control'),
      ).getByRole('combobox'),
    );

    expect(
      screen.getByTestId('language_selectors__target_language_option_label__ru__name'),
    ).toHaveTextContent('Русский');
    expect(
      screen.getByTestId('language_selectors__target_language_option_label__en__name'),
    ).toHaveTextContent('English');
    expect(
      screen.getByTestId('language_selectors__target_language_option_label__es__name'),
    ).toHaveTextContent('Español');
    expect(
      screen.getByTestId('language_selectors__target_language_option_label__uk__name'),
    ).toHaveTextContent('Українська');
  });

  it('opens practice settings from the top-right menu and updates cooldown months', async () => {
    const user = userEvent.setup();
    const store = createStore();

    render(
      <Provider store={store}>
        <LanguageSelectors />
      </Provider>,
    );

    await user.click(screen.getByRole('button', { name: 'Настройки практики' }));
    const fivePlusInput = screen.getByLabelText(
      'Последние 5 и более раз верно',
    );

    expect(fivePlusInput).toHaveValue(2);

    await user.clear(fivePlusInput);
    await user.type(fivePlusInput, '3');

    expect(
      store.getState().app.practiceSettings!.correctStreakCooldownMonths.fivePlus,
    ).toBe(3);
  });

  it('switches the app world from the top-right settings menu', async () => {
    const user = userEvent.setup();
    const store = createStore();

    render(
      <Provider store={store}>
        <LanguageSelectors />
      </Provider>,
    );

    await user.click(screen.getByRole('button', { name: 'Настройки практики' }));

    const worldSelect = screen.getByRole('combobox', {
      name: 'Мир приложения',
    });
    expect(worldSelect).toHaveTextContent('Футбол');

    await user.click(worldSelect);
    await user.click(screen.getByRole('option', { name: 'Лес' }));

    expect(store.getState().app.worldId).toBe('forest');
    expect(store.getState().app.assistantId).toBe('studyTroll');
  });

  it('updates practice frequency percentages from the top-right menu', async () => {
    const user = userEvent.setup();
    const store = createStore();

    render(
      <Provider store={store}>
        <LanguageSelectors />
      </Provider>,
    );

    await user.click(screen.getByRole('button', { name: 'Настройки практики' }));

    const repeatFrequency = screen.getByLabelText('Частота повторов ошибок');
    const newCardMix = screen.getByLabelText('Примешивание новых слов');

    expect(repeatFrequency).toHaveValue(25);
    expect(newCardMix).toHaveValue(25);

    await user.clear(repeatFrequency);
    await user.type(repeatFrequency, '40');
    await user.clear(newCardMix);
    await user.type(newCardMix, '35');

    expect(
      store.getState().app.practiceSettings!.recentMistakeRepeatFrequencyPercent,
    ).toBe(40);
    expect(
      store.getState().app.practiceSettings!.newCardMixFrequencyPercent,
    ).toBe(35);
  });

  it('configures up to two companion languages in the header without interface or target languages', async () => {
    const user = userEvent.setup();
    const store = createStore();

    render(
      <Provider store={store}>
        <LanguageSelectors />
      </Provider>,
    );

    const companionSelect = screen.getByRole('combobox', {
      name: 'Сопутствующие языки',
    });
    expect(companionSelect).toHaveTextContent('Español');
    expect(companionSelect).toHaveTextContent('Українська');

    await user.click(companionSelect);

    expect(screen.queryByRole('option', { name: /English/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Русский/ })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Español/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Українська/ })).toBeInTheDocument();

    await user.click(screen.getByRole('option', { name: /Español/ }));

    expect(store.getState().app.complementaryLanguages.en).toEqual(['uk']);
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
    preloadedState: {
      app: {
        ...appReducer(undefined, { type: 'test/init' }),
        complementaryLanguages: {
          en: ['es', 'uk'],
          ru: ['en', 'es'],
          es: ['ru', 'en'],
          uk: ['ru', 'en'],
        } satisfies ComplementaryLanguages,
        interfaceLanguage: 'ru' as const,
        targetLanguage: 'en' as const,
      },
    },
  });
}
