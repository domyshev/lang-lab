import { expect, test, type Page } from '@playwright/test';

test.describe('golden base visual snapshots', () => {
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

  test('agents llm import page', async ({ page }) => {
    await openGoldenApp(page);

    await page.getByTestId('app_shell__tab__agents').click();
    await expect(page.getByTestId('app__agents_section')).toBeVisible();
    await captureGolden(page, 'agents-llm-import');
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
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    const fixedNow = new Date('2026-07-08T12:00:00.000Z').getTime();
    Date.now = () => fixedNow;
    Math.random = () => 0.42;
  });

  await page.goto('/');
  await expect(page.getByTestId('player_onboarding__dialog')).toBeVisible();
  await page.getByTestId('player_onboarding__anonymous_button').click();
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
    .getByTestId('card_set_library__chip_select__default-set-love')
    .click();
  await expect(page.getByTestId('card_set_library__selected_name')).toHaveText(
    'Love',
  );
  await page.waitForTimeout(50);
  await page.getByRole('button', { name: exerciseName }).click();
  await expect(page.getByTestId('card_set_library__selected_name')).toHaveText(
    'Love',
  );
  await page.getByTestId('game_setup__start_button').click();
  await expect(page.getByTestId('app__active_exercise_section')).toBeVisible();
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
