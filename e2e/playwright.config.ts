import { defineConfig, devices } from '@playwright/test'

const externalBaseURL = process.env.BASE_URL

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  outputDir: 'test-results',
  use: {
    baseURL: externalBaseURL ?? 'http://127.0.0.1:5173',
    channel: 'chrome',
    viewport: { width: 1440, height: 900 },
    timezoneId: 'America/Bogota',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chrome',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
      },
      testIgnore: /.*\.setup\.ts/,
      dependencies: ['setup'],
    },
  ],
})
