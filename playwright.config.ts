import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.015,
      scale: 'css',
      threshold: 0.2,
    },
  },
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: false,
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { height: 1000, width: 1440 },
      },
    },
  ],
  reporter: [['list'], ['html', { open: 'never' }]],
  testDir: './e2e',
  timeout: 60_000,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    testIdAttribute: 'data-test',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command:
        'mkdir -p .playwright && cd backend && LANG_LAB_ADDR=127.0.0.1:8090 LANG_LAB_DB_PATH=../.playwright/language-lab-e2e.sqlite go run .',
      reuseExistingServer: false,
      timeout: 120_000,
      url: 'http://127.0.0.1:8090/healthz',
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 4173',
      reuseExistingServer: !process.env.CI,
      url: 'http://127.0.0.1:4173',
    },
  ],
  workers: 1,
});
