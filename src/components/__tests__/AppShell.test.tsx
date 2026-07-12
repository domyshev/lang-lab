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
      '1440px',
    );
    expect(screen.getByTestId('app_shell__main_tabs')).toHaveAttribute(
      'data-wide-scroll-buttons',
      'hidden-at-1440px',
    );
    const toolbarWideRule = findMediaStyleRule({
      element: screen.getByTestId('app_shell__toolbar'),
      media: '(min-width: 1440px)',
      selectorSuffix: '',
    });
    expect(toolbarWideRule?.getPropertyValue('flex-wrap')).toBe('nowrap');
    expect(toolbarWideRule?.getPropertyValue('min-height')).toBe('70px');
    expect(
      findMediaStyleRule({
        element: screen.getByTestId('app_shell__toolbar'),
        media: '(min-width: 1360px)',
        selectorSuffix: '',
      }),
    ).toBeUndefined();
    expect(
      findMediaStyleRule({
        element: screen.getByTestId('app_shell__main_tabs'),
        media: '(min-width: 1440px)',
        selectorSuffix: '.MuiTabs-scrollButtons',
      })?.getPropertyValue('display'),
    ).toBe('none');
    expect(screen.getByTestId('app_shell__logo_slot')).toHaveStyle({
      justifyContent: 'flex-start',
      minWidth: '250px',
    });
    expect(screen.getByTestId('app_logo__text')).toHaveStyle({
      letterSpacing: '0',
    });
    expect(
      getComputedStyle(screen.getByTestId('app_shell__tab__help')).minWidth,
    ).toBe('0');
    expect(screen.getByTestId('app_shell__tab__help')).toHaveStyle({
      marginLeft: '15px',
    });
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

  it('resets the shell scroll root only when the active section changes', () => {
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
    const { rerender } = render(
      <Provider store={store}>
        <AppShell activeSection="game">
          <div>Game content</div>
        </AppShell>
      </Provider>,
    );
    const scrollRoot = screen.getByTestId('app_shell__root');
    scrollRoot.scrollTop = 336.5;

    rerender(
      <Provider store={store}>
        <AppShell activeSection="help">
          <div>Help content</div>
        </AppShell>
      </Provider>,
    );

    expect(scrollRoot.scrollTop).toBe(0);

    scrollRoot.scrollTop = 212;
    rerender(
      <Provider store={store}>
        <AppShell activeSection="help">
          <div>Updated help content</div>
        </AppShell>
      </Provider>,
    );

    expect(scrollRoot.scrollTop).toBe(212);
  });
});

function findMediaStyleRule({
  element,
  media,
  selectorSuffix,
}: {
  element: HTMLElement;
  media: string;
  selectorSuffix: string;
}): CSSStyleDeclaration | undefined {
  const classSelectors = Array.from(element.classList, (name) => `.${name}`);

  for (const sheet of Array.from(document.styleSheets)) {
    for (const rule of Array.from(sheet.cssRules)) {
      if (rule.type !== CSSRule.MEDIA_RULE) {
        continue;
      }
      const mediaRule = rule as CSSMediaRule;
      if (mediaRule.conditionText !== media) {
        continue;
      }

      for (const nestedRule of Array.from(mediaRule.cssRules)) {
        const styleRule = nestedRule as CSSStyleRule;
        if (
          classSelectors.some((selector) =>
            styleRule.selectorText?.includes(selector),
          ) &&
          (!selectorSuffix || styleRule.selectorText?.includes(selectorSuffix))
        ) {
          return styleRule.style;
        }
      }
    }
  }

  return undefined;
}
