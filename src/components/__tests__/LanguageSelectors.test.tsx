import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
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
