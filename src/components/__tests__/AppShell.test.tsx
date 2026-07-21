// lang-lab — a language learning laboratory
// Copyright (C) 2026  Ilia Domyshev <ilia@domyshev.com>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published
// by the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';
import type { ExerciseAttempt } from '../../domain/exercises';
import { appReducer } from '../../store/appSlice';
import { attemptsReducer } from '../../store/attemptsSlice';
import { AppShell } from '../AppShell';
import { ServerSyncContext, type ServerSyncContextValue } from '../ServerDataGate';

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

  it('sets up the game world and requires a player name', async () => {
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
      screen.getByRole('dialog', { name: 'Game world setup' }),
    ).toBeInTheDocument();
    const dialog = screen.getByRole('dialog', {
      name: 'Game world setup',
    });

    expect(
      within(dialog).queryByText(
        'Your Spain supporter flag will travel with you through the football language lab.',
      ),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByTestId('player_onboarding__avatar_preview'),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: /Forest Elves/ }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      within(dialog).getByRole('button', { name: /Forest Elves/ }),
    ).toHaveStyle({
      background:
        'linear-gradient(135deg, #f4ffd8 0%, #b8ec9d 46%, #7fd4b0 100%) padding-box, repeating-linear-gradient(135deg, rgba(32, 48, 21, 0.58) 0 3px, rgba(255, 253, 244, 0.94) 3px 7px) border-box',
      borderColor: 'transparent',
    });
    expect(
      within(dialog).getByRole('button', { name: /^Football$/ }),
    ).not.toHaveTextContent('FIFA WK 2026');
    expect(
      within(dialog).getByTestId('player_onboarding__world_choice'),
    ).toHaveStyle({ gap: '8px', overflow: 'visible' });
    expect(within(dialog).getByTestId('player_onboarding__world_icon__football')).toBeInTheDocument();
    expect(within(dialog).getByTestId('player_onboarding__world_icon__forest')).toBeInTheDocument();
    expect(
      within(dialog).getByTestId('player_onboarding__world_icon__mortalKombat'),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByTestId('player_onboarding__world_icon__starTrek'),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: /Mortal Kombat/ }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: /Star Trek/ }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByTestId('player_onboarding__assistant_figure__forestElf'),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByTestId('player_onboarding__assistant_figure__ladybug'),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByTestId('player_onboarding__save_warning_anchor'),
    ).toBeInTheDocument();
    await user.hover(
      within(dialog).getByTestId('player_onboarding__save_warning_anchor'),
    );
    const saveWarningTooltip = await screen.findByTestId(
      'player_onboarding__save_warning_tooltip_icon__messages',
    );
    expect(saveWarningTooltip).toHaveTextContent('Choose character');
    expect(saveWarningTooltip).toHaveTextContent('Choose interface language');
    expect(saveWarningTooltip).toHaveTextContent('Choose target learning language');
    expect(saveWarningTooltip).toHaveTextContent('Choose player name');
    expect(saveWarningTooltip).not.toHaveTextContent(/^assistant$/i);
    await user.unhover(
      within(dialog).getByTestId('player_onboarding__save_warning_anchor'),
    );
    await user.hover(
      within(dialog).getByTestId('player_onboarding__assistant_figure__ladybug'),
    );
    const ladybugTooltipTitle = await screen.findByTestId(
      'player_onboarding__assistant_tooltip_title__ladybug',
    );
    const ladybugTooltipBody = screen.getByTestId(
      'player_onboarding__assistant_tooltip_body__ladybug',
    );
    expect(ladybugTooltipTitle).toHaveTextContent('Brave Ladybug');
    expect(ladybugTooltipTitle).toHaveStyle({ fontWeight: '850' });
    expect(ladybugTooltipBody).toHaveTextContent(
      'A tiny forest teammate with a surprisingly steady heart.',
    );
    expect(ladybugTooltipBody).toHaveStyle({ fontWeight: '500' });
    expect(ladybugTooltipTitle.closest('.MuiTooltip-tooltip')).toHaveStyle({
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      fontSize: '14px',
    });
    expect(ladybugTooltipTitle.closest('[data-popper-placement]')).toHaveAttribute(
      'data-popper-placement',
      expect.stringMatching(/^top|^left|^right|^bottom/),
    );
    await user.unhover(
      within(dialog).getByTestId('player_onboarding__assistant_figure__ladybug'),
    );
    expect(within(dialog).getByRole('combobox', { name: 'Interface language' })).toBeInTheDocument();
    expect(within(dialog).getByRole('combobox', { name: 'Target learning language' })).toBeInTheDocument();
    expect(within(dialog).getByRole('combobox', { name: 'Hint languages' })).toBeInTheDocument();
    expect(
      within(dialog).getByTestId('player_onboarding__interface_language_info_button'),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByTestId('player_onboarding__target_language_info_button'),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByTestId('player_onboarding__hint_languages_info_button'),
    ).toBeInTheDocument();
    await user.hover(
      within(dialog).getByTestId('player_onboarding__hint_languages_info_button'),
    );
    const hintInfoTooltip = await screen.findByTestId(
      'player_onboarding__hint_languages_info_tooltip',
    );
    expect(
      within(hintInfoTooltip).getByTestId(
        'player_onboarding__hint_languages_info_tooltip_title',
      ),
    ).toHaveTextContent('Hint languages');
    expect(hintInfoTooltip).toHaveTextContent(
      'At least one hint language stays selected.',
    );
    await user.unhover(
      within(dialog).getByTestId('player_onboarding__hint_languages_info_button'),
    );
    expect(
      within(dialog).queryByRole('button', { name: 'I forgot who I am' }),
    ).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: /^Football$/ }));
    expect(
      within(dialog).getByRole('button', { name: /^Football$/ }),
    ).toHaveStyle({
      background:
        'linear-gradient(135deg, #fff1a8 0%, #ffc400 36%, #c60b1e 100%) padding-box, repeating-linear-gradient(135deg, rgba(51, 23, 16, 0.62) 0 3px, rgba(255, 253, 244, 0.94) 3px 7px) border-box',
      borderColor: 'transparent',
    });
    await user.click(
      within(dialog).getByTestId('player_onboarding__assistant_figure__greenPower'),
    );
    await selectOnboardingOption(user, dialog, 'Interface language', 'English');
    await selectOnboardingOption(user, dialog, 'Target learning language', 'Español');
    await user.click(within(dialog).getByRole('combobox', { name: 'Hint languages' }));
    await user.click(
      await screen.findByTestId('player_onboarding__hint_languages_move_down__ru'),
    );
    await user.keyboard('{Escape}');
    await user.type(within(dialog).getByLabelText('Player name'), 'Alex');
    await user.click(within(dialog).getByRole('button', { name: 'Configure' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Game world setup' })).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('player_greeting__label').textContent).toBe('Alex');
    expect(screen.getByTestId('player_greeting__avatar')).toBeInTheDocument();
    expect(screen.getByTestId('player_greeting__avatar').tagName.toLowerCase()).toBe(
      'svg',
    );
    expect(
      screen.getByTestId('player_greeting__avatar__portugal_green_field'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('player_greeting__avatar__supporter_crest'),
    ).toBeInTheDocument();
    expect(store.getState().app.playerProfile).toMatchObject({
      displayName: 'Alex',
      isAnonymous: false,
    });
    expect(store.getState().app.assistantId).toBe('greenPower');
    expect(store.getState().app.interfaceLanguage).toBe('en');
    expect(store.getState().app.targetLanguage).toBe('es');
    expect(store.getState().app.worldId).toBe('football');
    expect(store.getState().app.complementaryLanguages.es).toEqual([
      'en',
      'ru',
      'uk',
    ]);
    expect(store.getState().app.playerProfile?.avatarSeed).toEqual(
      expect.stringContaining('supporter:portugal'),
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

    const dialog = screen.getByRole('dialog', {
      name: 'Game world setup',
    });
    await selectOnboardingOption(user, dialog, 'Interface language', 'Русский');
    expect(
      within(dialog).getByRole('button', { name: /Лесные эльфы/ }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      within(dialog).getByRole('button', { name: /^Футбол$/ }),
    ).not.toHaveTextContent('FIFA WK 2026');
    await user.click(
      within(dialog).getByTestId('player_onboarding__assistant_figure__studyTroll'),
    );
    await selectOnboardingOption(user, dialog, 'Язык - цель изучения', 'English');
    await user.type(within(dialog).getByLabelText('Имя игрока'), 'Илья');
    await user.click(within(dialog).getByRole('button', { name: 'Настроить' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Настройка игрового мира' })).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('player_greeting__label').textContent).toBe('Илья');
    expect(store.getState().app.playerProfile).toMatchObject({
      avatarSeed: expect.stringContaining('supporter:forest'),
      displayName: 'Илья',
      isAnonymous: false,
    });
    expect(store.getState().app.worldId).toBe('forest');
  });

  it('localizes the existing-token onboarding tab for Russian setup', async () => {
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

    const dialog = screen.getByRole('dialog', {
      name: 'Game world setup',
    });
    await selectOnboardingOption(user, dialog, 'Interface language', 'Русский');
    await user.click(within(dialog).getByRole('tab', { name: 'Войти по токену' }));

    expect(within(dialog).getByText('Войти по существующему токену')).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        'Вставьте сохраненный токен, чтобы загрузить с сервера те же карточки, настройки и историю игр.',
      ),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Токен доступа')).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'Загрузить пользователя' }),
    ).toBeInTheDocument();
    expect(within(dialog).queryByText('Use an existing token')).not.toBeInTheDocument();
    expect(
      within(dialog).queryByText(
        'Paste a saved token to load the same cards, settings, and game history from the backend.',
      ),
    ).not.toBeInTheDocument();
  });

  it('shows the player flag for the selected assistant country in the top bar', () => {
    const store = configureStore({
      reducer: {
        app: appReducer,
      },
      preloadedState: {
        app: {
          ...appReducer(undefined, { type: 'test/init' }),
          assistantId: 'greenPower' as const,
          playerProfile: {
            avatarSeed: 'supporter:spain:legacy-seed',
            displayName: 'Илья',
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

    expect(
      screen.getByTestId('player_greeting__avatar__portugal_green_field'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('player_greeting__avatar__spain_yellow_stripe'),
    ).not.toBeInTheDocument();
  });

  it('shows a distinct forest flag for the selected forest assistant in the top bar', () => {
    const store = configureStore({
      reducer: {
        app: appReducer,
      },
      preloadedState: {
        app: {
          ...appReducer(undefined, { type: 'test/init' }),
          assistantId: 'unicorn' as const,
          playerProfile: {
            avatarSeed: 'supporter:forest:legacy-seed',
            displayName: 'Илья',
            isAnonymous: false,
          },
          worldId: 'forest' as const,
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

    expect(
      screen.getByTestId('player_greeting__avatar__unicorn_mane'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('player_greeting__avatar__forest_leaf'),
    ).not.toBeInTheDocument();
  });

  it('changes Mortal Kombat and Star Trek flags with the selected assistant in the top bar', async () => {
    const user = userEvent.setup();
    const mortalKombatStore = configureStore({
      reducer: {
        app: appReducer,
      },
      preloadedState: {
        app: {
          ...appReducer(undefined, { type: 'test/init' }),
          assistantId: 'studyTroll' as const,
          playerProfile: {
            avatarSeed: 'supporter:mortal-kombat:test',
            displayName: 'Liu',
            isAnonymous: false,
          },
          worldId: 'mortalKombat' as const,
        },
      },
    });

    const { unmount } = render(
      <Provider store={mortalKombatStore}>
        <AppShell>
          <div>Content</div>
        </AppShell>
      </Provider>,
    );

    expect(
      screen.getByTestId('player_greeting__avatar__mk_flame_ninja_fire'),
    ).toBeInTheDocument();
    await user.click(
      within(screen.getByTestId('player_greeting__assistant_slot')).getByRole(
        'combobox',
      ),
    );
    await user.click(
      await screen.findByTestId('player_greeting__assistant_option__greenPower'),
    );
    expect(
      screen.getByTestId('player_greeting__avatar__mk_ice_guardian_crystal'),
    ).toBeInTheDocument();

    unmount();

    const starTrekStore = configureStore({
      reducer: {
        app: appReducer,
      },
      preloadedState: {
        app: {
          ...appReducer(undefined, { type: 'test/init' }),
          assistantId: 'studyTroll' as const,
          playerProfile: {
            avatarSeed: 'supporter:starfleet:test',
            displayName: 'Jean',
            isAnonymous: false,
          },
          worldId: 'starTrek' as const,
        },
      },
    });

    render(
      <Provider store={starTrekStore}>
        <AppShell>
          <div>Content</div>
        </AppShell>
      </Provider>,
    );

    expect(
      screen.getByTestId('player_greeting__avatar__trek_star_captain_delta'),
    ).toBeInTheDocument();
    await user.click(
      within(screen.getByTestId('player_greeting__assistant_slot')).getByRole(
        'combobox',
      ),
    );
    await user.click(
      await screen.findByTestId('player_greeting__assistant_option__greenPower'),
    );
    expect(
      screen.getByTestId('player_greeting__avatar__trek_science_officer_orbit'),
    ).toBeInTheDocument();
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
    expect(
      within(tooltip).queryByRole('textbox', { name: 'Edit name' }),
    ).not.toBeInTheDocument();

    await user.click(within(tooltip).getByRole('button', { name: 'Edit name' }));

    const nameInput = within(tooltip).getByRole('textbox', { name: 'Edit name' });

    await user.clear(nameInput);
    await user.type(nameInput, 'Педро');
    await user.click(within(tooltip).getByRole('button', { name: 'Save name' }));

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

  it('shows the saved server token in the player tooltip and copies it', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
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
          attempts: [],
        },
      },
    });
    const serverSync: ServerSyncContextValue = {
      apiToken: 'generated-token-123',
      clearNewToken: vi.fn(),
      createUser: vi.fn(),
      endpoint: 'http://127.0.0.1:8090',
      lastCreatedToken: '',
      loginWithToken: vi.fn(),
      status: 'ready',
    };

    render(
      <Provider store={store}>
        <ServerSyncContext.Provider value={serverSync}>
          <AppShell>
            <div>Content</div>
          </AppShell>
        </ServerSyncContext.Provider>
      </Provider>,
    );

    await user.hover(screen.getByTestId('player_greeting__root'));
    const tooltip = await screen.findByTestId('player_greeting__tooltip');
    const tokenInput = within(tooltip).getByTestId('player_greeting__api_token_input');

    expect(tokenInput).toHaveAttribute('type', 'password');
    expect(tokenInput).toHaveValue('generated-token-123');

    await user.click(within(tooltip).getByRole('button', { name: 'Copy token' }));

    expect(writeText).toHaveBeenCalledWith('generated-token-123');
  });

  it('localizes the server token tooltip and keeps level copy inside the level frame', async () => {
    const user = userEvent.setup();
    const store = configureStore({
      reducer: {
        app: appReducer,
        attempts: attemptsReducer,
      },
      preloadedState: {
        app: {
          ...appReducer(undefined, { type: 'test/init' }),
          interfaceLanguage: 'ru' as const,
          playerProfile: {
            avatarSeed: 'supporter:spain:test',
            displayName: 'Илья',
            isAnonymous: false,
          },
        },
        attempts: {
          attempts: [],
        },
      },
    });
    const serverSync: ServerSyncContextValue = {
      apiToken: 'generated-token-123',
      clearNewToken: vi.fn(),
      createUser: vi.fn(),
      endpoint: 'http://127.0.0.1:8090',
      lastCreatedToken: '',
      loginWithToken: vi.fn(),
      status: 'ready',
    };

    render(
      <Provider store={store}>
        <ServerSyncContext.Provider value={serverSync}>
          <AppShell>
            <div>Content</div>
          </AppShell>
        </ServerSyncContext.Provider>
      </Provider>,
    );

    await user.hover(screen.getByTestId('player_greeting__root'));
    const tooltip = await screen.findByTestId('player_greeting__tooltip');
    const nameRow = within(tooltip).getByTestId('player_greeting__name_row');
    const levelSummary = within(tooltip).getByTestId(
      'player_greeting__level_summary',
    );
    const tokenSection = within(tooltip).getByTestId(
      'player_greeting__api_token_section',
    );

    expect(tooltip.firstElementChild?.firstElementChild).toBe(levelSummary);
    expect(levelSummary.nextElementSibling).toBe(nameRow);
    expect(nameRow.nextElementSibling).toBe(tokenSection);
    expect(
      within(levelSummary).getByTestId('player_greeting__level_explanation'),
    ).toHaveTextContent(
      'Игровой уровень начинается здесь: сыграй еще несколько игр, и лаборатория начнет видеть твой ритм обучения.',
    );

    await user.hover(
      within(tokenSection).getByTestId('player_greeting__api_token_info_button'),
    );

    expect(await screen.findByText('Токен доступа к серверу')).toBeInTheDocument();
    expect(
      await screen.findByText(
        'Сохраните этот токен, чтобы открыть те же карточки, настройки и историю игр на другом устройстве.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('Server access token')).not.toBeInTheDocument();
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
      maxWidth: '345px',
      minHeight: '36px',
      position: 'relative',
      width: 'fit-content',
    });
    expect(
      within(screen.getByTestId('player_greeting__root')).queryByTestId(
        'player_greeting__assistant_slot',
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('player_greeting__assistant_slot')).toHaveStyle({
      marginLeft: '10px',
    });
    expect(screen.getByTestId('player_greeting__assistant_select')).toBeInTheDocument();
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
    expect(
      within(tooltip).queryByTestId('player_greeting__assistant_slot'),
    ).not.toBeInTheDocument();
    expect(tooltip).toHaveTextContent(
      'Илья-Супер-Длинное-Имя-Для-Проверки-Эллипсиса',
    );
    expect(tooltip).toHaveTextContent('Advanced newcomer');
    expect(tooltip).toHaveTextContent('45 games completed');
    expect(tooltip).toHaveTextContent(/game level/i);
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
      borderRadius: '999px',
      color: 'rgb(32, 48, 21)',
    });
    expect(gameTab).toHaveStyle({
      border: '0',
      background:
        'linear-gradient(180deg, #fff6b5 0%, #ffc52b 50%, #e98312 100%)',
    });
    expect(gameTab).toHaveStyle({ fontWeight: '950' });
    expect(gameTab).toHaveStyle({
      transition: 'box-shadow 150ms ease,filter 150ms ease',
    });
    expect(
      screen.getByTestId('app_shell__main_tabs').querySelector('.MuiTabs-indicator'),
    ).toHaveStyle({ display: 'none' });
    expect(gameTab).not.toHaveStyle({
      boxShadow:
        'inset 0 1px 0 rgba(255,255,255,0.9), 0 5px 12px rgba(92, 78, 22, 0.14)',
    });
  });

  it('uses an organic forest palette for the play tab in the forest world', () => {
    const store = configureStore({
      reducer: {
        app: appReducer,
      },
      preloadedState: {
        app: {
          ...appReducer(undefined, { type: 'test/init' }),
          interfaceLanguage: 'ru' as const,
          worldId: 'forest' as const,
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

    expect(screen.getByRole('tab', { name: 'Играть' })).toHaveStyle({
      background:
        'linear-gradient(180deg, #f8ffe6 0%, #93cc46 50%, #4f8730 100%)',
      color: '#183813',
    });
  });

  it('uses a light left-side tooltip for character options in the top selector', async () => {
    const user = userEvent.setup();
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
        <AppShell>
          <div>Content</div>
        </AppShell>
      </Provider>,
    );

    await user.click(screen.getByRole('combobox', { name: 'Персонаж' }));
    const optionIcon = await screen.findByTestId(
      'player_greeting__assistant_option_icon__studyTroll',
    );
    await user.hover(optionIcon);

    const optionTooltipTitle = await screen.findByTestId(
      'player_greeting__assistant_option_tooltip_title__studyTroll',
    );
    const optionTooltipBody = screen.getByTestId(
      'player_greeting__assistant_option_tooltip_body__studyTroll',
    );

    expect(optionTooltipTitle).toHaveTextContent('Испанский вингер');
    expect(optionTooltipTitle).toHaveStyle({ fontWeight: '850' });
    expect(optionTooltipBody).toHaveTextContent(
      'Бесстрашный фланговый вундеркинд',
    );
    expect(optionTooltipBody).toHaveStyle({ fontWeight: '500' });
    expect(optionTooltipTitle.closest('.MuiTooltip-tooltip')).toHaveStyle({
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      fontSize: '14px',
    });
    expect(optionTooltipTitle.closest('[data-popper-placement]')).toHaveAttribute(
      'data-popper-placement',
      expect.stringMatching(/^left/),
    );
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
