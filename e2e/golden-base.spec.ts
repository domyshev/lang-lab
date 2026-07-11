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
