import { defineConfig, devices } from "@playwright/test"

/**
 * Smoke tests against a running Petal that talks to a real Frappe bench.
 * Nothing starts a server here: point PETAL_E2E_URL at one (e.g. `pnpm dev`
 * with FRAPPE_BACKEND_URL set). Without PETAL_E2E_URL every test is skipped.
 *
 *   PETAL_E2E_URL=http://localhost:3000 \
 *   PETAL_E2E_USER=Administrator PETAL_E2E_PASSWORD=admin \
 *   pnpm e2e
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]] : "list",
  outputDir: "test-results",
  use: {
    baseURL: process.env.PETAL_E2E_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
})
