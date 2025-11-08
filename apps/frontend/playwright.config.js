'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
const test_1 = require('@playwright/test')
const PORT = process.env.PORT || 5173
const baseURL = `http://localhost:${PORT}`
exports.default = (0, test_1.defineConfig)({
  testDir: './tests/e2e',
  timeout: 60 * 1000,
  expect: {
    timeout: 5000,
  },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...test_1.devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm --filter frontend exec vite dev',
    url: baseURL,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
})
//# sourceMappingURL=playwright.config.js.map
