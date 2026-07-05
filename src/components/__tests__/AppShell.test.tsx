import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import { appReducer } from '../../store/appSlice';
import { AppShell } from '../AppShell';

describe('AppShell', () => {
  it('prevents header rubber-band overscroll on Mac trackpads', () => {
    const store = configureStore({
      reducer: {
        app: appReducer,
      },
    });

    render(
      <Provider store={store}>
        <AppShell>
          <div>Content</div>
        </AppShell>
      </Provider>,
    );

    expect(screen.getByTestId('app_shell__root')).toHaveStyle({
      height: '100dvh',
      overscrollBehaviorY: 'none',
      overflowY: 'auto',
    });
    expect(screen.getByTestId('app_shell__app_bar')).toHaveStyle({
      overscrollBehaviorY: 'none',
    });
  });
});
