import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
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

    expect(screen.getByTestId('assistant-select')).toHaveStyle({ height: '34px' });
    expect(screen.getByTestId('interface-language-select')).toHaveStyle({
      height: '34px',
    });
    expect(screen.getByTestId('target-language-select')).toHaveStyle({
      height: '34px',
    });
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
