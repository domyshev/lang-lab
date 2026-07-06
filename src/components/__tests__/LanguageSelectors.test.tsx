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
import { getAssistantTooltip } from '../../domain/assistants';
import { appReducer } from '../../store/appSlice';
import { attemptsReducer } from '../../store/attemptsSlice';
import { cardsReducer } from '../../store/cardsSlice';
import { statsReducer } from '../../store/statsSlice';
import { themesReducer } from '../../store/themesSlice';
import { LanguageSelectors } from '../LanguageSelectors';

describe('LanguageSelectors', () => {
  it('keeps all header selectors compact', () => {
    render(
      <Provider store={createStore()}>
        <LanguageSelectors />
      </Provider>,
    );

    expect(screen.getByTestId('language_selectors__assistant_select')).toHaveStyle(
      { height: '34px' },
    );
    expect(
      screen.getByTestId('language_selectors__interface_language_select'),
    ).toHaveStyle({
      height: '34px',
    });
    expect(screen.getByTestId('language_selectors__target_language_select')).toHaveStyle({
      height: '34px',
    });
  });

  it('shows character selector tooltips above the icon with light theme styles', async () => {
    const user = userEvent.setup();

    render(
      <Provider store={createStore()}>
        <LanguageSelectors />
      </Provider>,
    );

    await user.hover(
      screen.getByTestId('language_selectors__assistant_selected_icon__studyTroll'),
    );

    const tooltipText = await screen.findByText(
      getAssistantTooltip('studyTroll', 'ru'),
    );
    const tooltipRoot = screen.getByRole('tooltip');

    expect(tooltipRoot.closest('[data-popper-placement]')).toHaveAttribute(
      'data-popper-placement',
      expect.stringMatching(/^top/),
    );
    expect(tooltipText).toHaveStyle({
      backgroundColor: 'rgb(255, 255, 255)',
      color: 'rgb(32, 48, 21)',
      fontSize: '14px',
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
