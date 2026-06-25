import { defineConfig, devices } from '@playwright/test';

// TEMPORARY — reuses the dev server already running on :3000. Deleted after the run.
export default defineConfig({
  testDir: './tests/e2e',
  reporter: 'list',
  expect: { timeout: 10_000 },
  use: { baseURL: 'http://localhost:3000', trace: 'off' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
