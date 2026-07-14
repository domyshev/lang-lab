import { expect, test } from '@playwright/test';

test('creates a backend user token during onboarding and reloads from sqlite', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.getByTestId('player_onboarding__dialog')).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Create user' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Use existing token' })).toBeVisible();
  await page.getByTestId('player_onboarding__assistant_figure__studyTroll').click();

  await page.getByTestId('player_onboarding__interface_language_select').click();
  await page.getByRole('option', { name: 'English' }).click();

  await page.getByTestId('player_onboarding__target_language_select').click();
  await page.getByRole('option', { name: 'English' }).click();

  await page
    .getByTestId('player_onboarding__name_input')
    .getByRole('textbox')
    .fill('Playwright User');
  const createUserResponse = page.waitForResponse(
    (response) =>
      response.url() === 'http://127.0.0.1:8090/api/users' &&
      response.request().method() === 'POST' &&
      response.status() === 201,
  );
  await page.getByTestId('player_onboarding__save_button').click();
  await createUserResponse;

  await expect(page.getByTestId('server_token_dialog__dialog')).toBeVisible();
  const issuedToken = await page
    .getByTestId('server_token_dialog__token_input')
    .inputValue();
  await expect(page.getByTestId('server_token_dialog__token_input')).toHaveValue(
    /ll-/,
  );
  await page.getByTestId('server_token_dialog__close_button').click();

  await page.reload();

  await expect(page.getByTestId('app_shell__root')).toBeVisible();
  await expect(page.getByTestId('player_onboarding__dialog')).toBeHidden();
  await expect(page.getByText('Playwright User')).toBeVisible();

  await page.evaluate(() => window.localStorage.clear());
  await page.reload();

  await expect(page.getByTestId('player_onboarding__dialog')).toBeVisible();
  await page.getByRole('tab', { name: 'Use existing token' }).click();
  await page.getByLabel('Access token').fill(issuedToken);
  const loadUserResponse = page.waitForResponse(
    (response) =>
      response.url() === 'http://127.0.0.1:8090/api/state' &&
      response.request().method() === 'GET' &&
      response.status() === 200,
  );
  await page.getByTestId('player_onboarding__token_login_button').click();
  await loadUserResponse;

  await expect(page.getByTestId('player_onboarding__dialog')).toBeHidden();
  await expect(page.getByText('Playwright User')).toBeVisible();
});
