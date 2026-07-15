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
import { describe, expect, it, vi } from 'vitest';

vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: () => true,
  };
});
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
      screen.getByRole('combobox', { name: 'Язык - цель изучения' }),
    ).toBeInTheDocument();
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

    await user.click(screen.getByRole('button', { name: 'Настройки игр' }));
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

    await user.click(screen.getByRole('button', { name: 'Настройки игр' }));

    const worldSelect = screen.getByRole('combobox', {
      name: 'Игровой мир',
    });
    expect(worldSelect).not.toHaveTextContent('⚽');
    expect(
      screen.getByTestId('language_selectors__world_selected__icon'),
    ).toHaveStyle({
      borderRadius: '50%',
      height: '20px',
      width: '20px',
    });
    expect(worldSelect).toHaveTextContent('Футбол');

    await user.click(worldSelect);
    const worldOptions = screen.getAllByRole('option');
    expect(worldOptions[0]).toHaveTextContent('Лесные эльфы');
    expect(worldOptions[1]).toHaveTextContent('Футбол');
    expect(worldOptions[2]).toHaveTextContent('Mortal Kombat');
    expect(worldOptions[3]).toHaveTextContent('Star Trek');
    await user.click(screen.getByRole('option', { name: /Лесные эльфы/ }));

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

    await user.click(screen.getByRole('button', { name: 'Настройки игр' }));

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

  it('configures ordered companion languages in the header independently from the interface language', async () => {
    const user = userEvent.setup();
    const store = createStore();

    render(
      <Provider store={store}>
        <LanguageSelectors />
      </Provider>,
    );

    const companionSelect = screen.getByRole('combobox', {
      name: 'Языки подсказок',
    });
    expect(companionSelect).toHaveTextContent('Español');
    expect(companionSelect).toHaveTextContent('Українська');
    expect(companionSelect).toHaveTextContent('Русский');
    expect(
      screen.getByTestId('language_selectors__target_language_control'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('language_selectors__companion_languages_control'),
    ).toBeInTheDocument();

    await user.click(companionSelect);

    expect(screen.queryByRole('option', { name: /English/ })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Русский/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Español/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Українська/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Выше: Українська' }));
    expect(store.getState().app.complementaryLanguages.en).toEqual([
      'uk',
      'es',
      'ru',
    ]);

    await user.click(screen.getByRole('option', { name: /Русский/ }));

    expect(store.getState().app.complementaryLanguages.en).toEqual(['uk', 'es']);

    await user.click(screen.getByRole('option', { name: /Українська/ }));
    expect(store.getState().app.complementaryLanguages.en).toEqual(['es']);

    await user.click(screen.getByRole('option', { name: /Español/ }));
    expect(store.getState().app.complementaryLanguages.en).toEqual(['es']);
  });

  it('explains the header language selectors with readable info tooltips', async () => {
    const user = userEvent.setup();

    render(
      <Provider store={createStore()}>
        <LanguageSelectors />
      </Provider>,
    );

    expect(
      screen.getByTestId('language_selectors__interface_language_info_wrapper'),
    ).toHaveStyle({ marginLeft: '5px' });
    expect(
      screen.getByTestId('language_selectors__interface_language_info_button'),
    ).toHaveStyle({
      backgroundColor: 'rgba(255, 246, 181, 0.68)',
      borderColor: 'rgba(198, 11, 30, 0.22)',
      color: '#a45112',
    });

    await user.hover(screen.getByTestId('language_selectors__interface_language_info_button'));
    let tooltip = await screen.findByTestId('language_selectors__interface_language_info_tooltip');
    expect(
      within(tooltip).getByTestId(
        'language_selectors__interface_language_info_tooltip_title',
      ),
    ).toHaveTextContent('Язык интерфейса');
    expect(tooltip).toHaveTextContent(
      'Язык интерфейса меняет подписи, меню и подсказки приложения.',
    );
    expect(tooltip).toHaveStyle({
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      fontSize: '14px',
    });

    await user.unhover(screen.getByTestId('language_selectors__interface_language_info_button'));
    await user.hover(screen.getByTestId('language_selectors__target_language_info_button'));
    tooltip = await screen.findByTestId('language_selectors__target_language_info_tooltip');
    expect(
      within(tooltip).getByTestId(
        'language_selectors__target_language_info_tooltip_title',
      ),
    ).toHaveTextContent('Язык - цель изучения');
    expect(tooltip).toHaveTextContent(
      'Это язык, который вы тренируете и на котором вводите ответы в играх.',
    );

    await user.unhover(screen.getByTestId('language_selectors__target_language_info_button'));
    await user.hover(screen.getByTestId('language_selectors__companion_languages_info_button'));
    tooltip = await screen.findByTestId('language_selectors__companion_languages_info_tooltip');
    expect(
      within(tooltip).getByTestId(
        'language_selectors__companion_languages_info_tooltip_title',
      ),
    ).toHaveTextContent('Языки подсказок');
    expect(
      within(tooltip).getByTestId(
        'language_selectors__companion_languages_info_tooltip_line__0',
      ),
    ).toHaveTextContent('Языки подсказок показываются как переводы-подсказки в играх.');
    expect(
      within(tooltip).getByTestId(
        'language_selectors__companion_languages_info_tooltip_line__2',
      ),
    ).toHaveTextContent('По умолчанию:');
    expect(
      within(tooltip).getByTestId(
        'language_selectors__companion_languages_info_tooltip_line__3',
      ),
    ).toHaveTextContent('English -> Русский, Español, Українська');
    expect(
      within(tooltip).getByTestId(
        'language_selectors__companion_languages_info_tooltip_line_source__3',
      ),
    ).toHaveStyle({ fontWeight: '850' });
    expect(
      within(tooltip).getByTestId(
        'language_selectors__companion_languages_info_tooltip_line_source__4',
      ),
    ).toHaveTextContent('Русский');
    expect(
      within(tooltip).getByTestId(
        'language_selectors__companion_languages_info_tooltip_line_source__5',
      ),
    ).toHaveTextContent('Español');
    expect(
      within(tooltip).getByTestId(
        'language_selectors__companion_languages_info_tooltip_line__6',
      ),
    ).toHaveTextContent('Українська -> Русский, English, Español');
    expect(
      within(tooltip).getByTestId(
        'language_selectors__companion_languages_info_tooltip_line_source__6',
      ),
    ).toHaveTextContent('Українська');
  });

  it('uses the forest palette for selector and settings info icons in the forest world', async () => {
    const user = userEvent.setup();

    render(
      <Provider store={createStore({ worldId: 'forest' })}>
        <LanguageSelectors />
      </Provider>,
    );

    expect(screen.getByTestId('language_selectors__target_language_info_button')).toHaveStyle({
      backgroundColor: 'rgba(246, 255, 230, 0.76)',
      borderColor: 'rgba(91, 150, 54, 0.34)',
      color: '#386f2d',
    });

    await user.click(screen.getByRole('button', { name: 'Настройки игр' }));

    expect(screen.getByTestId('language_selectors__world_control')).toHaveStyle({
      marginBottom: '20px',
    });
    expect(screen.getByTestId('language_selectors__repeat_management_title')).toHaveTextContent(
      'Управление повторениями',
    );
    expect(screen.getByTestId('language_selectors__repeat_management_title')).toHaveStyle({
      marginTop: '15px',
    });
    expect(
      screen.getByTestId('language_selectors__settings_field_row__mistake_repeat_frequency'),
    ).toHaveStyle({ alignItems: 'flex-start' });
    const settingsInfoButton = screen.getByTestId(
      'language_selectors__settings_info_button__mistake_repeat_frequency',
    );
    expect(settingsInfoButton).toHaveStyle({
      backgroundColor: 'rgba(246, 255, 230, 0.76)',
      borderColor: 'rgba(91, 150, 54, 0.34)',
      color: '#386f2d',
      marginTop: '8px',
    });

    await user.hover(settingsInfoButton);
    const tooltip = await screen.findByTestId(
      'language_selectors__settings_info_tooltip__mistake_repeat_frequency',
    );
    expect(
      within(tooltip).getByTestId(
        'language_selectors__settings_info_tooltip_title__mistake_repeat_frequency',
      ),
    ).toHaveTextContent('Частота повторов ошибок');
    expect(tooltip).toHaveStyle({
      backgroundColor: 'rgba(255, 255, 255, 0.98)',
      fontSize: '14px',
    });
  });

  it('explains every game setting except the app world setting', async () => {
    const user = userEvent.setup();

    render(
      <Provider store={createStore()}>
        <LanguageSelectors />
      </Provider>,
    );

    await user.click(screen.getByRole('button', { name: 'Настройки игр' }));

    expect(screen.queryByTestId('language_selectors__world_info_button')).not.toBeInTheDocument();

    const expectedTooltips = [
      ['fivePlus', 'Если карточка отвечена верно 5 и более раз подряд'],
      ['four', 'Если карточка отвечена верно 4 раза подряд'],
      ['three', 'Если карточка отвечена верно 3 раза подряд'],
      ['mistake_repeat_frequency', 'Чем выше процент, тем чаще карточки с последними ошибками'],
      ['new_card_mix_frequency', 'Чем выше процент, тем чаще в очередь добавляются новые карточки'],
    ] as const;

    for (const [key, text] of expectedTooltips) {
      const button = screen.getByTestId(`language_selectors__settings_info_button__${key}`);
      await user.hover(button);
      const tooltip = await screen.findByTestId(
        `language_selectors__settings_info_tooltip__${key}`,
      );
      expect(
        within(tooltip).getByTestId(
          `language_selectors__settings_info_tooltip_title__${key}`,
        ),
      ).toBeInTheDocument();
      expect(
        await screen.findByTestId(`language_selectors__settings_info_tooltip__${key}`),
      ).toHaveTextContent(text);
      await user.unhover(button);
    }
  });

});

function createStore(app: Partial<ReturnType<typeof appReducer>> = {}) {
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
          en: ['es', 'uk', 'ru'],
          ru: ['en', 'es', 'uk'],
          es: ['ru', 'en', 'uk'],
          uk: ['ru', 'en', 'es'],
        } satisfies ComplementaryLanguages,
        interfaceLanguage: 'ru' as const,
        targetLanguage: 'en' as const,
        ...app,
      },
    },
  });
}
