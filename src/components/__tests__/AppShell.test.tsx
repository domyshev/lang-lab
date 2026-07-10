import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('asks for a first player name and greets an anonymous stranger with an avatar', async () => {
    const user = userEvent.setup();
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

    expect(
      screen.getByRole('dialog', { name: 'Как тебя зовут?' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Продолжить анонимно' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Как тебя зовут?' })).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('player_greeting__label')).toHaveTextContent(
      'Приветик, странник',
    );
    expect(screen.getByTestId('player_greeting__avatar')).toBeInTheDocument();
    expect(store.getState().app.playerProfile).toMatchObject({
      isAnonymous: true,
    });
    expect(store.getState().app.playerProfile?.avatarSeed).toEqual(
      expect.any(String),
    );
  });

  it('saves a first player name and shows it in the top bar', async () => {
    const user = userEvent.setup();
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

    await user.type(screen.getByLabelText('Имя игрока'), 'Илья');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Как тебя зовут?' })).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('player_greeting__label')).toHaveTextContent(
      'Приветик, Илья',
    );
    expect(store.getState().app.playerProfile).toMatchObject({
      displayName: 'Илья',
      isAnonymous: false,
    });
  });

  it('keeps the player greeting centered inside the header', () => {
    const store = configureStore({
      reducer: {
        app: appReducer,
      },
      preloadedState: {
        app: {
          ...appReducer(undefined, { type: 'test/init' }),
          playerProfile: {
            avatarSeed: 'test-player',
            displayName: 'Илюха',
            isAnonymous: false,
          },
        },
      },
    });

    render(
      <Provider store={store}>
        <AppShell>
          <div>Content</div>
        </AppShell>
      </Provider>,
    );

    expect(screen.getByTestId('app_shell__player_greeting_slot')).toHaveStyle({
      display: 'flex',
      flexGrow: '1',
      justifyContent: 'center',
    });
    expect(screen.getByTestId('player_greeting__root')).toHaveStyle({
      alignSelf: 'center',
      justifyContent: 'center',
      minHeight: '36px',
      position: 'relative',
      width: '250px',
    });
    expect(screen.getByTestId('player_greeting__avatar_slot')).toHaveStyle({
      left: '6px',
      position: 'absolute',
    });
    expect(screen.getByTestId('player_greeting__label')).toHaveStyle({
      alignItems: 'center',
      display: 'flex',
      justifyContent: 'center',
      textAlign: 'center',
      width: '100%',
    });
  });
});
