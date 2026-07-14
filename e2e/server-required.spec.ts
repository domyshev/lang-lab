import { expect, test } from '@playwright/test';

test('requires backend, saves onboarding data, and reloads it from sqlite', async ({
  page,
}) => {
  const apiKey = `sqlite-e2e-${Date.now()}`;

  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Server connection required' }),
  ).toBeVisible();
  await expect(page.getByTestId('app_shell__root')).toBeHidden();

  await page.getByLabel('Server endpoint').fill('http://127.0.0.1:8090');
  await page.getByLabel('API key').fill(apiKey);
  await page.getByRole('button', { name: 'Connect' }).click();

  await expect(page.getByTestId('player_onboarding__dialog')).toBeVisible();
  await page.getByTestId('player_onboarding__assistant_figure__studyTroll').click();

  await page.getByTestId('player_onboarding__interface_language_select').click();
  await page.getByRole('option', { name: 'English' }).click();

  await page.getByTestId('player_onboarding__target_language_select').click();
  await page.getByRole('option', { name: 'English' }).click();

  await page
    .getByTestId('player_onboarding__name_input')
    .getByRole('textbox')
    .fill('Playwright User');
  const saveResponse = page.waitForResponse(
    (response) =>
      response.url() === 'http://127.0.0.1:8090/api/state' &&
      response.request().method() === 'PUT' &&
      response.status() === 200,
  );
  await page.getByTestId('player_onboarding__save_button').click();
  await saveResponse;

  await page.reload();

  await expect(page.getByTestId('app_shell__root')).toBeVisible();
  await expect(page.getByTestId('player_onboarding__dialog')).toBeHidden();
  await expect(page.getByText('Playwright User')).toBeVisible();
});
