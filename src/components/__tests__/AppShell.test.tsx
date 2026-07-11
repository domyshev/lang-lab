import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor, within } from '@testing-library/react';
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
      'Привет, странник',
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
      'Привет, Илья',
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

  it('hands nowrap to a measured desktop width while preserving the logo and target settings group', () => {
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

    expect(screen.getByTestId('app_shell__toolbar')).toHaveAttribute(
      'data-nowrap-breakpoint',
      '1360px',
    );
    expect(screen.getByTestId('app_shell__main_tabs')).toHaveAttribute(
      'data-wide-scroll-buttons',
      'hidden-at-1360px',
    );
    expect(screen.getByTestId('app_shell__logo_slot')).toHaveStyle({
      justifyContent: 'flex-start',
      minWidth: '250px',
    });
    expect(screen.getByTestId('app_logo__text')).toHaveStyle({
      letterSpacing: '0',
    });
    expect(
      getComputedStyle(screen.getByTestId('app_shell__tab__agents')).minWidth,
    ).toBe('0');
    const selectorsSlot = screen.getByTestId('app_shell__selectors_slot');
    expect(selectorsSlot).toHaveStyle({ flexShrink: '0' });
    const targetSettingsGroup = within(selectorsSlot).getByTestId(
      'language_selectors__target_settings_group',
    );
    expect(
      within(targetSettingsGroup).getByTestId(
        'language_selectors__target_language_control',
      ),
    ).toBeInTheDocument();
    expect(
      within(targetSettingsGroup).getByTestId(
        'language_selectors__practice_settings_button',
      ),
    ).toBeInTheDocument();
  });
});
