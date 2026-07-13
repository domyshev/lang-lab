import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import type { ExerciseAttempt } from '../../domain/exercises';
import { appReducer } from '../../store/appSlice';
import { attemptsReducer } from '../../store/attemptsSlice';
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

  it('asks for a first player name and shows an anonymous stranger name with an avatar', async () => {
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
    const dialog = screen.getByRole('dialog', { name: 'Как тебя зовут?' });

    expect(within(dialog).getByRole('combobox', { name: 'Персонаж' })).toBeInTheDocument();
    expect(within(dialog).getByRole('combobox', { name: 'Интерфейс' })).toBeInTheDocument();
    expect(within(dialog).getByRole('combobox', { name: 'Цель' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Продолжить анонимно' })).toBeDisabled();

    await selectOnboardingOption(user, dialog, 'Персонаж', 'Португальский бомбардир');
    await selectOnboardingOption(user, dialog, 'Интерфейс', 'English');
    await selectOnboardingOption(user, dialog, 'Target', 'Español');
    await user.click(within(dialog).getByRole('button', { name: 'Continue anonymously' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'What should we call you?' })).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('player_greeting__label').textContent).toBe('wanderer');
    expect(screen.getByTestId('player_greeting__avatar')).toBeInTheDocument();
    expect(screen.getByTestId('player_greeting__avatar').tagName.toLowerCase()).toBe(
      'svg',
    );
    expect(
      screen.getByTestId('player_greeting__avatar__spain_yellow_stripe'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('player_greeting__avatar__supporter_crest'),
    ).toBeInTheDocument();
    expect(store.getState().app.playerProfile).toMatchObject({
      isAnonymous: true,
    });
    expect(store.getState().app.assistantId).toBe('greenPower');
    expect(store.getState().app.interfaceLanguage).toBe('en');
    expect(store.getState().app.targetLanguage).toBe('es');
    expect(store.getState().app.playerProfile?.avatarSeed).toEqual(
      expect.stringContaining('supporter:spain'),
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

    const dialog = screen.getByRole('dialog', { name: 'Как тебя зовут?' });
    await selectOnboardingOption(user, dialog, 'Персонаж', 'Испанский вингер');
    await selectOnboardingOption(user, dialog, 'Интерфейс', 'Русский');
    await selectOnboardingOption(user, dialog, 'Цель', 'English');
    await user.type(within(dialog).getByLabelText('Имя игрока'), 'Илья');
    await user.click(within(dialog).getByRole('button', { name: 'Сохранить' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Как тебя зовут?' })).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('player_greeting__label').textContent).toBe('Илья');
    expect(store.getState().app.playerProfile).toMatchObject({
      avatarSeed: expect.stringContaining('supporter:spain'),
      displayName: 'Илья',
      isAnonymous: false,
    });
  });

  it('edits the player name from the player tooltip', async () => {
    const user = userEvent.setup();
    const store = configureStore({
      reducer: {
        app: appReducer,
        attempts: attemptsReducer,
      },
      preloadedState: {
        app: {
          ...appReducer(undefined, { type: 'test/init' }),
          playerProfile: {
            avatarSeed: 'supporter:spain:test',
            displayName: 'Илья',
            isAnonymous: false,
          },
        },
        attempts: {
          attempts: createAttempts(7),
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

    await user.hover(screen.getByTestId('player_greeting__root'));
    const tooltip = await screen.findByTestId('player_greeting__tooltip');
    const nameInput = within(tooltip).getByLabelText('Изменить имя');

    await user.clear(nameInput);
    await user.type(nameInput, 'Педро');
    await user.click(within(tooltip).getByRole('button', { name: 'Сохранить имя' }));

    await waitFor(() => {
      expect(screen.getByTestId('player_greeting__label')).toHaveTextContent('Педро');
    });
    expect(store.getState().app.playerProfile).toMatchObject({
      displayName: 'Педро',
      isAnonymous: false,
    });
    expect(store.getState().app.playerProfile?.avatarSeed).toEqual(
      expect.stringContaining('supporter:spain'),
    );
  });

  it('keeps the player greeting compact, centered, and shows the player level tooltip', async () => {
    const user = userEvent.setup();
    const attempts = createAttempts(45);
    const store = configureStore({
      reducer: {
        app: appReducer,
        attempts: attemptsReducer,
      },
      preloadedState: {
        app: {
          ...appReducer(undefined, { type: 'test/init' }),
          playerProfile: {
            avatarSeed: 'test-player',
            displayName: 'Илья-Супер-Длинное-Имя-Для-Проверки-Эллипсиса',
            isAnonymous: false,
          },
        },
        attempts: {
          attempts,
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
      maxWidth: '230px',
      minHeight: '36px',
      position: 'relative',
      width: 'fit-content',
    });
    expect(screen.getByTestId('player_greeting__avatar_slot')).toHaveStyle({
      left: '6px',
      position: 'absolute',
    });
    expect(screen.getByTestId('player_greeting__label')).toHaveStyle({
      alignItems: 'center',
      cursor: 'default',
      display: 'flex',
      justifyContent: 'center',
      overflow: 'hidden',
      textAlign: 'center',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      width: '100%',
    });

    await user.hover(screen.getByTestId('player_greeting__root'));

    const tooltip = await screen.findByTestId('player_greeting__tooltip');
    expect(tooltip).toHaveTextContent(
      'Илья-Супер-Длинное-Имя-Для-Проверки-Эллипсиса',
    );
    expect(tooltip).toHaveTextContent('Продвинутый новичок');
    expect(tooltip).toHaveTextContent('45 пройдено игр');
    expect(tooltip).toHaveTextContent(/игровой уровень/i);
    expect(screen.getByTestId('player_greeting__level_icon')).toBeInTheDocument();
    expect(tooltip).toHaveStyle({
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      fontSize: '14px',
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
    const tabsFlexContainer = screen
      .getByTestId('app_shell__main_tabs')
      .querySelector('.MuiTabs-flexContainer');
    expect(tabsFlexContainer).toHaveStyle({
      gap: '15px',
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

  it('renders the game tab as a playful play call to action', () => {
    const store = configureStore({
      reducer: {
        app: appReducer,
      },
      preloadedState: {
        app: {
          ...appReducer(undefined, { type: 'test/init' }),
          interfaceLanguage: 'ru' as const,
          playerProfile: {
            avatarSeed: 'test-player',
            displayName: 'Илья',
            isAnonymous: false,
          },
        },
      },
    });

    render(
      <Provider store={store}>
        <AppShell activeSection="game">
          <div>Content</div>
        </AppShell>
      </Provider>,
    );

    const gameTab = screen.getByRole('tab', { name: 'Играть' });
    expect(gameTab).toHaveStyle({
      backgroundColor: 'rgb(255, 247, 205)',
      borderRadius: '999px',
      color: 'rgb(32, 48, 21)',
    });
    expect(gameTab).toHaveStyle({ fontWeight: '950' });
    expect(gameTab).not.toHaveStyle({
      boxShadow:
        'inset 0 1px 0 rgba(255,255,255,0.9), 0 5px 12px rgba(92, 78, 22, 0.14)',
    });
  });

  it('uses a readable stadium-blue active tab and a football AI chat icon', () => {
    const store = configureStore({
      reducer: {
        app: appReducer,
      },
      preloadedState: {
        app: {
          ...appReducer(undefined, { type: 'test/init' }),
          playerProfile: {
            avatarSeed: 'supporter:spain:test',
            displayName: 'Илья',
            isAnonymous: false,
          },
        },
      },
    });

    render(
      <Provider store={store}>
        <AppShell activeSection="chat">
          <div>Content</div>
        </AppShell>
      </Provider>,
    );

    expect(screen.getByTestId('app_shell__tab__chat')).toHaveStyle({
      color: '#123c69',
    });
    expect(
      screen.getByTestId('app_shell__tab_icon__chat_football_ai_ball'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('app_shell__tab_icon__chat_robot'),
    ).not.toBeInTheDocument();
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

function createAttempts(count: number): ExerciseAttempt[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `attempt-${index}`,
    exerciseSessionId: `session-${index}`,
    exerciseType: 'missingLetters',
    cardSetId: 'all-cards',
    targetLanguage: 'en',
    createdAt: `2026-07-03T10:${String(index % 60).padStart(2, '0')}:00.000Z`,
    completedAt: `2026-07-03T10:${String(index % 60).padStart(2, '0')}:30.000Z`,
    cardSnapshots: [],
    prompts: [],
    answers: {},
    correctness: {},
    hintsUsed: {},
  }));
}

async function selectOnboardingOption(
  user: ReturnType<typeof userEvent.setup>,
  dialog: HTMLElement,
  label: string,
  option: string,
) {
  await user.click(within(dialog).getByRole('combobox', { name: label }));
  await user.click(await screen.findByRole('option', { name: option }));
}

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
