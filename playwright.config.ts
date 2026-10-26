import { defineConfig, devices } from '@playwright/test';
import { env } from './src/config/env';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: env.isCI,
  /* Retry on CI only */
  retries: env.isCI ? 2 : 0,
  workers: env.isCI ? 4 : undefined,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  /* Local: interactive HTML report. CI: blob (merged across shards) + JUnit for the GitLab MR widget. */
  reporter: env.isCI
    ? [['list'], ['blob'], ['junit', { outputFile: 'junit-results/results.xml' }]]
    : [['list'], ['html', { open: 'never' }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'api',
      testDir: './tests/api',
      use: { baseURL: env.apiUrl },
    },
    {
      name: 'e2e-chromium',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Chrome'], baseURL: env.baseUrl },
    },

    /* {
      name: 'e2e-firefox',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Firefox'], baseURL: env.baseUrl },
    },

    {
      name: 'e2e-webkit',
      testDir: './tests/e2e',
      use: { ...devices['Desktop Safari'], baseURL: env.baseUrl },
    }, */
  ],
});
