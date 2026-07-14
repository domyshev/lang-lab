import { expect, test, type Page } from '@playwright/test';
import {
  DEFAULT_OPENROUTER_MODEL_ID,
  OPENROUTER_TRIAL_KEY,
} from '../src/services/openRouterKeyStorage';

const iphone15ProMaxViewport = { height: 932, width: 430 };

test.describe('golden base visual snapshots', () => {
  test('runs the mocked golden AI Assistant workflow', async ({ page }) => {
    const fakeKey = 'task-8-fake-key';
    const openRouterEndpoint = 'https://openrouter.ai/api/v1/chat/completions';
    const requestBodies: Array<Record<string, unknown>> = [];
    const requestHeaders: Array<Record<string, string>> = [];
    const requestUrls: string[] = [];
    const unexpectedOpenRouterUrls: string[] = [];
    let releaseFinalResponse = () => {};
    let markFinalRequestReceived = () => {};
    const finalResponseGate = new Promise<void>((resolve) => {
      releaseFinalResponse = resolve;
    });
    const finalRequestReceived = new Promise<void>((resolve) => {
      markFinalRequestReceived = resolve;
    });

    await page.route(
      'https://openrouter.ai/**',
      async (route) => {
        const request = route.request();
        const requestUrl = request.url();
        if (requestUrl !== openRouterEndpoint) {
          unexpectedOpenRouterUrls.push(requestUrl);
          await route.abort('blockedbyclient');
          return;
        }

        requestUrls.push(requestUrl);
        requestHeaders.push(await request.allHeaders());
        requestBodies.push(request.postDataJSON() as Record<string, unknown>);
        const responseIndex = requestBodies.length - 1;
        const responseMessage =
          responseIndex === 0
            ? assistantToolResponse('read-catenary', 'search_cards', {
                query: 'catenary',
                languages: ['en', 'ru'],
                limit: 100,
              })
            : responseIndex === 1
              ? assistantToolResponse(
                  'propose-rail-set',
                  'propose_library_operation',
                  {
                    title: 'Rail essentials',
                    summary: 'Create a localized rail set with one catenary card.',
                    cards: [
                      {
                        clientRef: 'catenary-card',
                        translations: {
                          en: 'catenary',
                          es: 'catenaria',
                          ru: 'контактная сеть',
                        },
                        definitions: {
                          en: 'An overhead wire system that powers electric trains.',
                        },
                        tags: ['travel', 'rail'],
                        difficulty: 'easy',
                      },
                    ],
                    cardSetChanges: [
                      {
                        type: 'create',
                        clientRef: 'rail-set',
                        names: {
                          en: 'Rail essentials',
                          es: 'Viajes en tren',
                          ru: 'Железная дорога',
                        },
                        cardRefs: ['catenary-card'],
                      },
                    ],
                  },
                )
              : {
                  role: 'assistant',
                  content: 'I staged the localized rail set for review.',
                };

        if (responseIndex === 2) {
          markFinalRequestReceived();
          await finalResponseGate;
        }
        await route.fulfill({
          contentType: 'application/json',
          status: 200,
          body: JSON.stringify({ choices: [{ message: responseMessage }] }),
        });
      },
    );
    await openGoldenApp(page);

    await page.getByTestId('card_set_library__ai_assistant_button').click();
    await expect(page.getByTestId('app_chat__assistant')).toBeVisible();
    await openAiConnectionSettings(page);
    await page.getByTestId('ai_connection__key_input').fill(fakeKey);
    await page.getByTestId('ai_connection__save_button').click();
    await page.getByTestId('ai_connection__close_settings_button').click();
    await expect(page.getByTestId('ai_connection__settings_dialog')).toBeHidden();
    await page
      .getByTestId('ai_chat__composer_field')
      .getByRole('textbox')
      .fill('Create a tiny travel set from this word list: catenary.');
    await page.getByTestId('ai_chat__send_button').click();

    await finalRequestReceived;
    await expect(page.getByTestId('ai_chat__thinking')).toBeVisible();
    releaseFinalResponse();
    await expect(
      page.getByText('I staged the localized rail set for review.'),
    ).toBeVisible();
    const operationPreview = page.getByTestId('ai_operation_preview__panel');
    await expect(operationPreview).toBeVisible();
    await expect(page.getByTestId('ai_operation_preview__title')).toHaveText(
      'Rail essentials',
    );
    await expect(
      page.getByTestId('ai_operation_preview__count__createdCards'),
    ).toContainText('1');
    await expect(
      page.getByTestId('ai_operation_preview__count__createdCardSets'),
    ).toContainText('1');

    const operationPreviewStyle = await operationPreview.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        backgroundColor: style.backgroundColor,
        borderStyle: style.borderStyle,
        isPaper: element.classList.contains('MuiPaper-root'),
        surface: element.getAttribute('data-surface'),
      };
    });
    expect(operationPreviewStyle).toEqual({
      backgroundColor: 'rgb(245, 240, 255)',
      borderStyle: 'none',
      isPaper: false,
      surface: 'purple-unframed',
    });
    await expect(operationPreview).toHaveScreenshot(
      'ai-assistant-operation-preview.png',
    );

    expect(requestBodies).toHaveLength(3);
    expect(unexpectedOpenRouterUrls).toEqual([]);
    expect(requestUrls).toEqual([
      openRouterEndpoint,
      openRouterEndpoint,
      openRouterEndpoint,
    ]);
    for (const [requestIndex, body] of requestBodies.entries()) {
      const headers = requestHeaders[requestIndex];
      expect(headers.authorization).toBe(`Bearer ${fakeKey}`);
      expect(requestUrls[requestIndex]).not.toContain(fakeKey);
      expect(JSON.stringify(body)).not.toContain(fakeKey);
      expect(
        JSON.stringify(
          Object.entries(headers).filter(
            ([headerName]) => headerName.toLowerCase() !== 'authorization',
          ),
        ),
      ).not.toContain(fakeKey);
      expect(body).toMatchObject({
        model: DEFAULT_OPENROUTER_MODEL_ID,
        tool_choice: 'auto',
        parallel_tool_calls: false,
        stream: false,
      });
      expect(
        (body.tools as Array<{ function: { name: string } }>).map(
          (tool) => tool.function.name,
        ),
      ).toEqual([
        'list_card_sets',
        'get_card_set',
        'search_cards',
        'get_cards',
        'propose_library_operation',
      ]);
    }
    expect(requestBodies[1].messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: 'assistant',
          tool_calls: [
            expect.objectContaining({
              id: 'read-catenary',
              function: expect.objectContaining({ name: 'search_cards' }),
            }),
          ],
        }),
        expect.objectContaining({ role: 'tool', tool_call_id: 'read-catenary' }),
      ]),
    );
    const finalMessages = requestBodies[2].messages as Array<{
      content: string;
      role: string;
      tool_call_id?: string;
    }>;
    expect(finalMessages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: 'tool',
          tool_call_id: 'propose-rail-set',
        }),
      ]),
    );
    const proposalResult = finalMessages.find(
      (message) => message.tool_call_id === 'propose-rail-set',
    );
    expect(JSON.parse(proposalResult!.content)).toMatchObject({
      ok: true,
      operation: {
        modelId: DEFAULT_OPENROUTER_MODEL_ID,
        title: 'Rail essentials',
      },
    });

    await page.getByTestId('ai_operation_preview__apply_button').click();
    await expect(page.getByTestId('ai_operation_preview__panel')).toBeHidden();
    await page.getByTestId('app_shell__tab__cards').click();
    const createdSet = page
      .locator('[data-test^="card_set_list__tile__"]')
      .filter({ hasText: 'Rail essentials' });
    await expect(createdSet).toBeVisible();
    await createdSet
      .locator('[data-test^="card_set_list__tile_select_area__"]')
      .click();
    await expect(
      page.locator('[data-test^="card_set_detail__title__"]'),
    ).toHaveText('Rail essentials');
    await expect(
      page.locator('[data-test^="card_set_detail__card_item__"]').filter({
        hasText: 'catenary',
      }),
    ).toBeVisible();

    await page.getByTestId('app_shell__tab__chat').click();
    const historyItem = page
      .locator('[data-test^="ai_operation_history__item__"]')
      .filter({ hasText: 'Rail essentials' });
    await expect(historyItem).toBeVisible();
    await expect(
      historyItem.locator('[data-test^="ai_operation_history__status__"]'),
    ).toHaveText('Применено');
    await historyItem
      .locator('[data-test^="ai_operation_history__rollback_button__"]')
      .click();
    await expect(
      historyItem.locator('[data-test^="ai_operation_history__status__"]'),
    ).toHaveText('Отменено');

    await page.getByTestId('app_shell__tab__cards').click();
    await expect(
      page
        .locator('[data-test^="card_set_list__tile__"]')
        .filter({ hasText: 'Rail essentials' }),
    ).toHaveCount(0);
    await expect(
      page.locator('[data-test^="card_set_detail__card_item__"]').filter({
        hasText: 'catenary',
      }),
    ).toHaveCount(0);
  });

  test('games home', async ({ page }) => {
    await openGoldenApp(page);

    await expect(page.getByTestId('game_setup__panel')).toBeVisible();
    await captureGolden(page, 'games-home');
  });

  test('games home on mobile', async ({ page }) => {
    await page.setViewportSize({ height: 844, width: 390 });
    await openGoldenApp(page);

    await expect(page.getByTestId('game_setup__panel')).toBeVisible();
    await captureGolden(page, 'games-home-mobile');
  });

  test('key surfaces fit iPhone 15 Pro Max without horizontal overflow', async ({
    page,
  }) => {
    await page.setViewportSize(iphone15ProMaxViewport);
    await openGoldenApp(page);

    await expectNoHorizontalOverflow(page);

    await page.getByTestId('app_shell__tab__cards').click();
    await expect(page.getByTestId('card_set_detail__panel__all-cards')).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByTestId('app_shell__tab__statistics').click();
    await expect(page.getByTestId('target_stats__panel')).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByTestId('app_shell__tab__chat').click();
    await expect(page.getByTestId('app_chat__assistant')).toBeVisible();
    await expectNoHorizontalOverflow(page);

    await page.getByTestId('app_shell__tab__game').click();
    await startExercise(page, 'Пропущенные буквы');
    await expect(
      page.locator('[data-test^="missing_letters_exercise__panel__"]'),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('card set library modal', async ({ page }) => {
    await openGoldenApp(page);

    await page.getByTestId('card_set_library__open_button').click();
    await expect(page.getByTestId('card_set_library_dialog__root')).toBeVisible();
    await captureGolden(page, 'card-set-library-modal');
  });

  test('cards catalog', async ({ page }) => {
    await openGoldenApp(page);

    await page.getByTestId('app_shell__tab__cards').click();
    await expect(page.getByTestId('card_set_detail__panel__all-cards')).toBeVisible();
    await captureGolden(page, 'cards-catalog');
  });

  test('statistics empty state', async ({ page }) => {
    await openGoldenApp(page);

    await page.getByTestId('app_shell__tab__statistics').click();
    await expect(page.getByTestId('target_stats__panel')).toBeVisible();
    await expect(page.getByTestId('history_view__empty_panel')).toBeVisible();
    await captureGolden(page, 'statistics-empty');
  });

  test('AI Assistant workspace', async ({ page }) => {
    await page.setViewportSize({ height: 1400, width: 1440 });
    await openGoldenApp(page);

    await page.getByTestId('app_shell__tab__chat').click();
    await expect(page.getByTestId('app_chat__assistant')).toBeVisible();
    await openAiConnectionSettings(page);
    await expect(page.getByTestId('ai_connection__key_input')).toHaveValue(
      OPENROUTER_TRIAL_KEY,
    );
    await page.getByTestId('ai_connection__close_settings_button').click();
    await expect(page.getByTestId('ai_connection__settings_dialog')).toBeHidden();
    await expectNoHorizontalOverflow(page);
    await captureGolden(page, 'ai-assistant-workspace');
  });

  test('AI Assistant workspace on a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ height: 2200, width: 390 });
    await openGoldenApp(page);

    await page.getByTestId('app_shell__tab__chat').click();
    await expect(page.getByTestId('app_chat__assistant')).toBeVisible();
    await openAiConnectionSettings(page);
    await expect(page.getByTestId('ai_connection__key_input')).toHaveValue(
      OPENROUTER_TRIAL_KEY,
    );
    await page.getByTestId('ai_connection__close_settings_button').click();
    await expect(page.getByTestId('ai_connection__settings_dialog')).toBeHidden();
    await expectNoHorizontalOverflow(page);
    await captureGolden(page, 'ai-assistant-workspace-narrow');
  });

  test('missing letters exercise', async ({ page }) => {
    await openGoldenApp(page);
    await startExercise(page, 'Пропущенные буквы');

    await expect(page.getByTestId('app__active_exercise_section')).toBeVisible();
    await expect(page.locator('[data-test^="missing_letters_exercise__panel__"]')).toBeVisible();
    await captureGolden(page, 'exercise-missing-letters');
  });

  test('missing word exercise', async ({ page }) => {
    await openGoldenApp(page);
    await startExercise(page, 'Пропущенное слово');

    await expect(page.getByTestId('app__active_exercise_section')).toBeVisible();
    await expect(page.locator('[data-test^="missing_word_exercise__panel__"]')).toBeVisible();
    await captureGolden(page, 'exercise-missing-word');
  });

  test('multiple choice exercise', async ({ page }) => {
    await openGoldenApp(page);
    await startExercise(page, 'Вопрос с 3 вариантами');

    await expect(page.getByTestId('app__active_exercise_section')).toBeVisible();
    await expect(page.locator('[data-test^="multiple_choice_exercise__panel__"]')).toBeVisible();
    await captureGolden(page, 'exercise-multiple-choice');
  });

  test('crossword exercise', async ({ page }) => {
    await openGoldenApp(page);
    await startExercise(page, 'Кроссворд');

    await expect(page.getByTestId('app__active_exercise_section')).toBeVisible();
    await expect(page.getByTestId('crossword_exercise__panel')).toBeVisible();
    await captureGolden(page, 'exercise-crossword');
  });

  test('saves and replays an incomplete crossword result', async ({
    page,
  }, testInfo) => {
    await openGoldenApp(page);
    await startExercise(page, 'Кроссворд');

    const firstClue = page
      .locator('[data-test^="crossword_exercise__clue_number__"]')
      .first();
    await firstClue.click();

    const filledCellTests: string[] = [];
    const inputCount = await page
      .locator('[data-test^="crossword_exercise__input_cell__"]')
      .count();

    for (let index = 0; index < inputCount; index += 1) {
      const focusedInput = page.locator(
        '[data-test^="crossword_exercise__input_cell__"]:focus',
      );
      const currentDataTest = await focusedInput.getAttribute('data-test');
      expect(currentDataTest).toBeTruthy();
      filledCellTests.push(currentDataTest!);

      await page.keyboard.type('x');

      const nextDataTest = await page
        .locator('[data-test^="crossword_exercise__input_cell__"]:focus')
        .getAttribute('data-test');
      if (nextDataTest === currentDataTest) {
        break;
      }
    }

    expect(filledCellTests.length).toBeGreaterThan(1);
    const unansweredDataTest = await page
      .locator('[data-test^="crossword_exercise__input_cell__"]')
      .evaluateAll((elements) =>
        elements
          .find((element) => (element as HTMLInputElement).value === '')
          ?.getAttribute('data-test'),
      );
    expect(unansweredDataTest).toBeTruthy();

    await expect(page.getByTestId('crossword_exercise__submit_button')).toBeEnabled();
    await page.getByTestId('crossword_exercise__submit_button').click();
    await page.getByTestId('app_shell__tab__statistics').click();

    const attemptCard = page
      .locator('[data-test^="history_view__attempt_card__"]')
      .first();
    await expect(attemptCard).toBeVisible();
    await attemptCard.getByRole('button', { name: /Кроссворд/ }).click();

    const replayGrid = attemptCard.locator(
      '[data-test^="history_view__crossword_replay__"][data-test$="__grid"]',
    );
    await expect(replayGrid).toBeVisible();
    await expect(
      replayGrid.locator('[data-test*="__empty_cell__"]').first(),
    ).toBeVisible();

    const unansweredCellSuffix = unansweredDataTest!.replace(
      'crossword_exercise__input_cell__',
      '',
    );
    await expect(
      replayGrid.locator(`[data-test$="__cell__${unansweredCellSuffix}"]`),
    ).toHaveText('');
    await expect(
      replayGrid.locator('[data-test*="__cell__"][style*="line-through"]').first(),
    ).toBeVisible();
    await expect(
      replayGrid.locator('button[data-test*="__clue_number__"]').first(),
    ).toBeVisible();

    const correctionAnchor = replayGrid
      .locator('button[data-test*="__correction__"][data-test$="__anchor"]')
      .first();
    await correctionAnchor.hover();
    const correctionTooltip = page
      .locator('[data-test*="__correction__"][data-test$="__tooltip"]')
      .first();
    await expect(correctionTooltip).toBeVisible();
    await expect(correctionTooltip).not.toContainText('Правильный ответ');
    await expect(
      correctionTooltip
        .locator('[data-test*="__entry__"][data-test$="__number"]')
        .first(),
    ).toBeVisible();
    await expect(
      correctionTooltip
        .locator('[data-test*="__answer__cell__"]')
        .first(),
    ).toHaveCSS('background-color', 'rgb(235, 247, 225)');

    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath('crossword-history-replay.png'),
    });
  });

  test('keeps the assistant tooltip visible beside the character on a narrow viewport', async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ height: 844, width: 760 });
    await openGoldenApp(page);
    await startExercise(page, 'Пропущенные буквы');

    const assistant = page.locator(
      '[data-test^="coach_panel__assistant_sticker_wrapper__"]',
    );
    await assistant.hover();
    const tooltip = page.getByTestId('coach_panel__assistant_tooltip');
    await expect(tooltip).toBeVisible();

    const assistantBounds = await assistant.boundingBox();
    const tooltipBounds = await tooltip.boundingBox();
    expect(assistantBounds).not.toBeNull();
    expect(tooltipBounds).not.toBeNull();
    expect(tooltipBounds!.x).toBeGreaterThanOrEqual(
      assistantBounds!.x + assistantBounds!.width,
    );
    expect(tooltipBounds!.x).toBeGreaterThanOrEqual(0);
    expect(tooltipBounds!.x + tooltipBounds!.width).toBeLessThanOrEqual(760);
    expect(tooltipBounds!.y).toBeGreaterThanOrEqual(0);
    expect(tooltipBounds!.y + tooltipBounds!.height).toBeLessThanOrEqual(844);

    const hotkeyCursor = await page
      .getByTestId('exercise_finish_action__hotkeys_anchor')
      .evaluate((element) => getComputedStyle(element).cursor);
    expect(hotkeyCursor).not.toBe('text');

    await page.screenshot({
      fullPage: true,
      path: testInfo.outputPath('narrow-assistant-tooltip.png'),
    });
  });
});

async function openGoldenApp(page: Page) {
  const apiKey = `golden-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;

  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    const fixedNow = new Date('2026-07-08T12:00:00.000Z').getTime();
    Date.now = () => fixedNow;
    Math.random = () => 0.42;
  });

  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Server connection required' }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByLabel('Server endpoint').fill('http://127.0.0.1:8090');
  await page.getByLabel('API key').fill(apiKey);
  await page.getByTestId('server_data_gate__connect_button').click();
  await expect(page.getByTestId('player_onboarding__dialog')).toBeVisible();
  await page.getByTestId('player_onboarding__assistant_figure__forestElf').click();
  await page.getByTestId('player_onboarding__interface_language_select').click();
  await page.getByRole('option', { name: 'Русский' }).click();
  await page.getByTestId('player_onboarding__target_language_select').click();
  await page.getByRole('option', { name: 'English' }).click();
  await page
    .getByTestId('player_onboarding__name_input')
    .getByRole('textbox')
    .fill('Golden User');
  await page.getByTestId('player_onboarding__save_button').click();
  await expect(page.getByTestId('player_onboarding__dialog')).toBeHidden();
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        caret-color: transparent !important;
        scroll-behavior: auto !important;
        transition: none !important;
      }
    `,
  });
  await expect(page.getByTestId('app_shell__root')).toBeVisible();
  await expect(page.getByTestId('card_set_library__chip_select__all-cards')).toBeVisible();
}

async function startExercise(page: Page, exerciseName: string) {
  await page
    .getByTestId('card_set_library__chip_select__default-set-love-relationships')
    .click();
  await expect(page.getByTestId('card_set_library__selected_name')).toHaveText(
    'Love and relationships',
  );
  await page.waitForTimeout(50);
  await page.getByRole('button', { name: exerciseName }).click();
  await expect(page.getByTestId('card_set_library__selected_name')).toHaveText(
    'Love and relationships',
  );
  await page.getByTestId('game_setup__start_button').click();
  await expect(page.getByTestId('app__active_exercise_section')).toBeVisible();
}

async function openAiConnectionSettings(page: Page) {
  await page.getByTestId('ai_connection__model_select').click();
  await page.getByTestId('ai_connection__settings_option').click();
  await expect(page.getByTestId('ai_connection__settings_dialog')).toBeVisible();
}

async function captureGolden(page: Page, name: string) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(async () => {
    await document.fonts?.ready;
  });

  await expect(page).toHaveScreenshot(`${name}.png`, {
    fullPage: true,
  });
}

async function expectNoHorizontalOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    documentClientWidth: document.documentElement.clientWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    shellClientWidth:
      document.querySelector<HTMLElement>('[data-test="app_shell__root"]')
        ?.clientWidth ?? 0,
    shellScrollWidth:
      document.querySelector<HTMLElement>('[data-test="app_shell__root"]')
        ?.scrollWidth ?? 0,
  }));

  expect(widths.documentScrollWidth).toBeLessThanOrEqual(
    widths.documentClientWidth,
  );
  expect(widths.shellScrollWidth).toBeLessThanOrEqual(widths.shellClientWidth);
}

function assistantToolResponse(
  id: string,
  name: string,
  arguments_: Record<string, unknown>,
) {
  return {
    role: 'assistant',
    content: null,
    tool_calls: [
      {
        id,
        type: 'function',
        function: { name, arguments: JSON.stringify(arguments_) },
      },
    ],
  };
}
